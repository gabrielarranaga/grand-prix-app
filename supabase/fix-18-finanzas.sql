-- Fix 18: dashboard de finanzas para el admin (ingresos / egresos por mes).
--
-- Dos tablas:
--   * categorias_financieras: las define el negocio desde la app (no quedan
--     fijas en el codigo). Si una categoria ya tiene movimientos no se borra,
--     se archiva (activa = false) para no romper los totales historicos.
--   * movimientos_financieros: cada ingreso o egreso, con monto numeric
--     (nunca float para dinero).
--
-- Los pagos de paquete que el admin marca en /admin/pagos entran solos como
-- ingreso (categoria "Paquetes"), via trigger sobre compras_paquete. Asi no
-- hay que cargarlos dos veces. Todo lo demas se carga a mano.
--
-- Todo es solo-admin a nivel de base de datos (RLS con is_admin()), ademas
-- de la proteccion de rutas /admin en el middleware y en cada Server Action.

create type public.tipo_movimiento as enum ('ingreso', 'egreso');

create table public.categorias_financieras (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (length(trim(nombre)) > 0),
  tipo public.tipo_movimiento not null,
  activa boolean not null default true,
  created_at timestamptz not null default now()
);

-- Evita "Combustible" y "combustible " como si fueran dos categorias.
create unique index categorias_financieras_nombre_unico
  on public.categorias_financieras (tipo, lower(trim(nombre)));

create table public.movimientos_financieros (
  id uuid primary key default gen_random_uuid(),
  fecha date not null default (now() at time zone 'America/Lima')::date,
  tipo public.tipo_movimiento not null,
  categoria_id uuid not null references public.categorias_financieras (id) on delete restrict,
  monto numeric(10, 2) not null check (monto > 0),
  notas text,
  -- Solo para los ingresos generados automaticamente desde /admin/pagos.
  compra_id uuid references public.compras_paquete (id) on delete set null,
  created_at timestamptz not null default now()
);

create index movimientos_financieros_fecha_idx on public.movimientos_financieros (fecha);
create index movimientos_financieros_compra_idx on public.movimientos_financieros (compra_id);

-- El tipo del movimiento tiene que coincidir con el de su categoria (no se
-- puede registrar un egreso en una categoria de ingreso).
create function public.validar_tipo_movimiento()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_tipo public.tipo_movimiento;
begin
  select tipo into v_tipo from public.categorias_financieras where id = new.categoria_id;
  if v_tipo is distinct from new.tipo then
    raise exception 'La categoria no corresponde al tipo de movimiento';
  end if;
  return new;
end;
$$;

create trigger before_movimiento_write
  before insert or update on public.movimientos_financieros
  for each row execute function public.validar_tipo_movimiento();

alter table public.categorias_financieras enable row level security;
alter table public.movimientos_financieros enable row level security;

create policy "categorias financieras: solo admin"
  on public.categorias_financieras for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "movimientos financieros: solo admin"
  on public.movimientos_financieros for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Categorias iniciales (pedidas por el negocio). Se pueden renombrar,
-- archivar o agregar mas desde /admin/finanzas.
insert into public.categorias_financieras (nombre, tipo) values
  ('Paquetes', 'ingreso'),
  ('Clases sueltas', 'ingreso'),
  ('Combustible', 'egreso'),
  ('Mantenimiento de autos', 'egreso'),
  ('Pago a instructores', 'egreso'),
  ('Publicidad', 'egreso');

-- ============ Ingreso automatico desde /admin/pagos ============
-- Cada vez que cambia el estado de una compra, se ajusta lo cobrado de esa
-- compra para que coincida con el estado:
--   pendiente / cancelado -> 0
--   parcial               -> 50% del precio
--   pagado                -> 100% del precio
-- Si sube (pendiente -> parcial -> pagado) se agrega un ingreso con fecha de
-- hoy por la diferencia: el 50% y el resto caen en el mes en que se cobraron.
-- Si baja (correccion o anulacion) se quitan los ingresos automaticos de esa
-- compra y se deja uno solo por lo que corresponde.
create function public.registrar_ingreso_por_pago()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_objetivo numeric(10, 2);
  v_registrado numeric(10, 2);
  v_categoria uuid;
  v_primera_fecha date;
  v_hoy date := (now() at time zone 'America/Lima')::date;
  v_nota text;
begin
  v_objetivo := case new.estado
    when 'pagado' then new.precio
    when 'parcial' then round(new.precio / 2, 2)
    else 0
  end;

  select coalesce(sum(monto), 0), min(fecha)
    into v_registrado, v_primera_fecha
    from public.movimientos_financieros
    where compra_id = new.id;

  if v_objetivo = v_registrado then
    return new;
  end if;

  select c.id into v_categoria
    from public.categorias_financieras c
    where c.tipo = 'ingreso' and lower(c.nombre) = 'paquetes'
    order by c.activa desc, c.created_at
    limit 1;

  if v_categoria is null then
    insert into public.categorias_financieras (nombre, tipo)
      values ('Paquetes', 'ingreso')
      returning id into v_categoria;
  end if;

  select 'Paquete ' || p.nombre || ' - ' || pr.nombre
    into v_nota
    from public.paquetes p, public.profiles pr
    where p.id = new.paquete_id and pr.id = new.alumno_id;

  if v_objetivo > v_registrado then
    insert into public.movimientos_financieros (fecha, tipo, categoria_id, monto, notas, compra_id)
      values (v_hoy, 'ingreso', v_categoria, v_objetivo - v_registrado, v_nota, new.id);
  else
    delete from public.movimientos_financieros where compra_id = new.id;
    if v_objetivo > 0 then
      insert into public.movimientos_financieros (fecha, tipo, categoria_id, monto, notas, compra_id)
        values (coalesce(v_primera_fecha, v_hoy), 'ingreso', v_categoria, v_objetivo, v_nota, new.id);
    end if;
  end if;

  return new;
end;
$$;

create trigger after_compra_estado_update
  after update of estado on public.compras_paquete
  for each row
  when (old.estado is distinct from new.estado)
  execute function public.registrar_ingreso_por_pago();

-- ============ Resumen mensual (lo calcula la base, no el navegador) ============
-- Devuelve los totales por mes y categoria de los ultimos p_meses meses
-- terminando en p_mes (cualquier dia de ese mes sirve). Rechaza a quien no
-- sea admin aunque llame a la funcion directo por API.
create function public.resumen_financiero(p_mes date, p_meses int default 12)
returns table (
  mes date,
  tipo public.tipo_movimiento,
  categoria_id uuid,
  categoria text,
  total numeric
)
language plpgsql
stable
security invoker
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  return query
    select date_trunc('month', m.fecha)::date as mes,
           m.tipo,
           c.id,
           c.nombre,
           sum(m.monto) as total
      from public.movimientos_financieros m
      join public.categorias_financieras c on c.id = m.categoria_id
     where m.fecha >= (date_trunc('month', p_mes) - make_interval(months => greatest(p_meses, 1) - 1))::date
       and m.fecha < (date_trunc('month', p_mes) + interval '1 month')::date
     group by 1, 2, 3, 4;
end;
$$;

revoke execute on function public.resumen_financiero(date, int) from anon;
