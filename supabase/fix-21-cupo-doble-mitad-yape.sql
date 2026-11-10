-- Fix 21: cuatro cambios pedidos por el dueño (2026-11-08).
--
-- 1) DOS clases a la vez por franja (una por auto). Antes el indice unico
--    dejaba UNA sola fila activa por fecha+hora, asi que con 2 autos y 2
--    instructores la escuela solo podia dar la mitad de clases. Ahora cada
--    fila lleva un "cupo" (1 o 2) y el indice unico es por fecha+hora+cupo.
--    Al reservar, el cupo N se le asigna solo al N-esimo profesor (por fecha
--    de creacion de su cuenta); el admin lo puede cambiar igual que antes.
-- 2) Bloqueo a mitad de curso: con el 50% pagado ('parcial') el alumno solo
--    puede reservar la mitad de las clases de su paquete (redondeado hacia
--    arriba). Para seguir reservando tiene que completar el segundo pago.
-- 3) cancelar_reserva comparaba la hora de la clase en UTC: el limite de
--    "4 horas antes" en realidad era ~9 horas antes. Ahora usa hora de Lima.
-- 4) "Como nos conociste" (profiles.origen) y comprobantes de Yape: el
--    alumno sube la captura y el admin la aprueba con un toque, lo que
--    desbloquea horarios y registra el ingreso en finanzas (trigger fix-18).
--
-- Correr completo en el SQL Editor de Supabase ANTES de publicar la app.

-- ============ 1) Cupo doble ============

alter table public.horarios_clase
  add column if not exists cupo smallint not null default 1;

alter table public.horarios_clase
  drop constraint if exists horarios_clase_cupo_valido;
alter table public.horarios_clase
  add constraint horarios_clase_cupo_valido check (cupo between 1 and 2);

drop index if exists public.horarios_clase_fecha_hora_activa_unica;
create unique index if not exists horarios_clase_fecha_hora_cupo_activa_unica
  on public.horarios_clase (fecha, hora_inicio, cupo)
  where estado <> 'cancelado';

-- Cuantas clases puede haber a la vez en una franja (= autos/instructores).
create or replace function public.cupos_por_franja()
returns smallint
language sql
immutable
as $$ select 2::smallint $$;

-- Toma un cupo libre de la franja: reutiliza una fila 'disponible' (queda
-- una asi cuando alguien cancela) o crea la fila del primer cupo sin usar.
-- Devuelve la fila ya en el estado pedido. Solo la llaman otras funciones.
create or replace function public.tomar_cupo(
  p_fecha date,
  p_hora_inicio time,
  p_hora_fin time,
  p_estado public.estado_horario
)
returns public.horarios_clase
language plpgsql
security definer set search_path = public
as $$
declare
  v_horario public.horarios_clase;
  v_cupo smallint;
  v_profesor uuid;
  v_intento int := 0;
begin
  loop
    v_intento := v_intento + 1;

    select * into v_horario
    from public.horarios_clase
    where fecha = p_fecha and hora_inicio = p_hora_inicio and estado = 'disponible'
    order by cupo
    limit 1
    for update skip locked;

    if v_horario.id is null then
      select min(n) into v_cupo
      from generate_series(1, public.cupos_por_franja()) as n
      where not exists (
        select 1 from public.horarios_clase h
        where h.fecha = p_fecha and h.hora_inicio = p_hora_inicio
          and h.cupo = n and h.estado <> 'cancelado'
      );

      if v_cupo is null then
        raise exception 'Ese horario ya no esta disponible';
      end if;
    else
      v_cupo := v_horario.cupo;
    end if;

    if p_estado = 'reservado' then
      select id into v_profesor
      from public.profiles
      where rol = 'profesor'
      order by created_at
      offset v_cupo - 1
      limit 1;
    else
      v_profesor := null;
    end if;

    begin
      if v_horario.id is null then
        insert into public.horarios_clase (fecha, hora_inicio, hora_fin, estado, cupo, profesor_id)
        values (p_fecha, p_hora_inicio, p_hora_fin, p_estado, v_cupo, v_profesor)
        returning * into v_horario;
      else
        update public.horarios_clase
        set estado = p_estado, profesor_id = coalesce(v_profesor, profesor_id)
        where id = v_horario.id
        returning * into v_horario;
      end if;
      return v_horario;
    exception when unique_violation then
      -- Otro alumno tomo ese mismo cupo en el mismo instante: probar el otro.
      if v_intento >= 3 then
        raise exception 'Ese horario ya no esta disponible';
      end if;
      v_horario := null;
    end;
  end loop;
end;
$$;

revoke execute on function public.tomar_cupo(date, time, time, public.estado_horario) from public, anon, authenticated;

-- ============ 2) Clases permitidas segun lo pagado ============

-- Pagado = todas las clases del paquete; 50% = la mitad, redondeado arriba.
create or replace function public.clases_permitidas(p_alumno uuid)
returns integer
language sql
stable
security definer set search_path = public
as $$
  select coalesce(sum(
    case c.estado
      when 'pagado' then p.num_clases
      when 'parcial' then ceil(p.num_clases / 2.0)::int
      else 0
    end), 0)::int
  from public.compras_paquete c
  join public.paquetes p on p.id = c.paquete_id
  where c.alumno_id = p_alumno and c.estado in ('parcial', 'pagado');
$$;

create or replace function public.clases_incluidas(p_alumno uuid)
returns integer
language sql
stable
security definer set search_path = public
as $$
  select coalesce(sum(p.num_clases), 0)::int
  from public.compras_paquete c
  join public.paquetes p on p.id = c.paquete_id
  where c.alumno_id = p_alumno and c.estado in ('parcial', 'pagado');
$$;

create or replace function public.clases_usadas(p_alumno uuid)
returns integer
language sql
stable
security definer set search_path = public
as $$
  select count(*)::int
  from public.reservas r
  where r.alumno_id = p_alumno and r.estado in ('confirmada', 'completada', 'no_show');
$$;

-- Un alumno solo puede consultar sus propios numeros; el admin, los de todos.
create or replace function public.mi_avance()
returns table (incluidas integer, permitidas integer, usadas integer)
language sql
stable
security definer set search_path = public
as $$
  select public.clases_incluidas(auth.uid()),
         public.clases_permitidas(auth.uid()),
         public.clases_usadas(auth.uid());
$$;

revoke execute on function public.clases_permitidas(uuid) from public, anon;
revoke execute on function public.clases_incluidas(uuid) from public, anon;
revoke execute on function public.clases_usadas(uuid) from public, anon;
grant execute on function public.mi_avance() to authenticated;

-- Valida si p_alumno puede reservar una clase mas, y que no tenga ya otra
-- clase en esa misma franja (no puede estar en los dos autos a la vez).
create or replace function public.validar_puede_reservar(
  p_alumno uuid,
  p_fecha date,
  p_hora_inicio time,
  p_es_admin boolean
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_incluidas integer := public.clases_incluidas(p_alumno);
  v_permitidas integer := public.clases_permitidas(p_alumno);
  v_usadas integer := public.clases_usadas(p_alumno);
begin
  if v_usadas >= v_permitidas then
    if v_usadas < v_incluidas then
      if p_es_admin then
        raise exception 'Ese alumno debe completar su segundo pago para reservar mas clases';
      end if;
      raise exception 'Completa tu segundo pago para seguir reservando';
    end if;
    if p_es_admin then
      raise exception 'Ese alumno ya reservo todas las clases incluidas en su paquete';
    end if;
    raise exception 'Ya reservaste todas las clases incluidas en tu paquete';
  end if;

  if exists (
    select 1
    from public.reservas r
    join public.horarios_clase h on h.id = r.horario_clase_id
    where r.alumno_id = p_alumno and r.estado = 'confirmada'
      and h.fecha = p_fecha and h.hora_inicio = p_hora_inicio
  ) then
    raise exception 'Ya tienes una clase en ese horario';
  end if;
end;
$$;

revoke execute on function public.validar_puede_reservar(uuid, date, time, boolean) from public, anon, authenticated;

create or replace function public.reservar_clase_en_fecha(
  p_fecha date,
  p_hora_inicio time,
  p_hora_fin time
)
returns public.reservas
language plpgsql
security definer set search_path = public
as $$
declare
  v_horario public.horarios_clase;
  v_reserva public.reservas;
begin
  perform public.validar_puede_reservar(auth.uid(), p_fecha, p_hora_inicio, false);

  v_horario := public.tomar_cupo(p_fecha, p_hora_inicio, p_hora_fin, 'reservado');

  insert into public.reservas (alumno_id, horario_clase_id, estado)
  values (auth.uid(), v_horario.id, 'confirmada')
  returning * into v_reserva;

  return v_reserva;
end;
$$;

create or replace function public.asignar_clase_a_alumno(
  p_fecha date,
  p_hora_inicio time,
  p_hora_fin time,
  p_alumno_id uuid
)
returns public.reservas
language plpgsql
security definer set search_path = public
as $$
declare
  v_horario public.horarios_clase;
  v_reserva public.reservas;
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  perform public.validar_puede_reservar(p_alumno_id, p_fecha, p_hora_inicio, true);

  v_horario := public.tomar_cupo(p_fecha, p_hora_inicio, p_hora_fin, 'reservado');

  insert into public.reservas (alumno_id, horario_clase_id, estado)
  values (p_alumno_id, v_horario.id, 'confirmada')
  returning * into v_reserva;

  return v_reserva;
end;
$$;

-- Bloquear = cerrar TODOS los cupos libres de la franja (vacaciones, no
-- atienden). Si un cupo ya tiene clase reservada, esa clase se respeta.
create or replace function public.bloquear_horario(
  p_fecha date,
  p_hora_inicio time,
  p_hora_fin time
)
returns public.horarios_clase
language plpgsql
security definer set search_path = public
as $$
declare
  v_horario public.horarios_clase;
  v_bloqueados int := 0;
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  loop
    begin
      v_horario := public.tomar_cupo(p_fecha, p_hora_inicio, p_hora_fin, 'bloqueado');
      v_bloqueados := v_bloqueados + 1;
    exception when others then
      exit;
    end;
  end loop;

  if v_bloqueados = 0 then
    raise exception 'Ese horario ya no tiene cupos libres para bloquear';
  end if;

  return v_horario;
end;
$$;

grant execute on function public.reservar_clase_en_fecha(date, time, time) to authenticated;
grant execute on function public.asignar_clase_a_alumno(date, time, time, uuid) to authenticated;
grant execute on function public.bloquear_horario(date, time, time) to authenticated;

-- ============ 3) Cancelar con hora de Lima ============

create or replace function public.cancelar_reserva(p_reserva_id uuid)
returns public.reservas
language plpgsql
security definer set search_path = public
as $$
declare
  v_reserva public.reservas;
  v_horario public.horarios_clase;
begin
  select * into v_reserva from public.reservas where id = p_reserva_id and alumno_id = auth.uid();

  if v_reserva is null then
    raise exception 'Reserva no encontrada';
  end if;

  if v_reserva.estado <> 'confirmada' then
    raise exception 'Esta reserva ya no se puede cancelar';
  end if;

  select * into v_horario from public.horarios_clase where id = v_reserva.horario_clase_id for update;

  if ((v_horario.fecha + v_horario.hora_inicio) at time zone 'America/Lima') - now() < interval '4 hours' then
    raise exception 'Ya no se puede cancelar, faltan menos de 4 horas para la clase';
  end if;

  update public.reservas set estado = 'cancelada' where id = p_reserva_id returning * into v_reserva;
  update public.horarios_clase set estado = 'disponible' where id = v_horario.id;

  return v_reserva;
end;
$$;

-- ============ 4a) Como nos conociste ============

alter table public.profiles add column if not exists origen text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nombre, telefono, rol, origen)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', new.email),
    new.raw_user_meta_data ->> 'telefono',
    coalesce((new.raw_user_meta_data ->> 'rol')::public.rol_usuario, 'alumno'),
    nullif(new.raw_user_meta_data ->> 'origen', '')
  );
  return new;
end;
$$;

-- ============ 4b) Datos de Yape del negocio ============

alter table public.configuracion_negocio add column if not exists yape_numero text;
alter table public.configuracion_negocio add column if not exists yape_titular text;

-- ============ 4c) Comprobantes de pago (captura de Yape/Plin) ============

create table if not exists public.comprobantes_pago (
  id uuid primary key default gen_random_uuid(),
  compra_id uuid not null references public.compras_paquete (id) on delete cascade,
  alumno_id uuid not null references public.profiles (id) on delete cascade,
  -- Que pago cubre: 'primera_mitad', 'segunda_mitad' o 'total'.
  tramo text not null check (tramo in ('primera_mitad', 'segunda_mitad', 'total')),
  monto numeric(10, 2) not null check (monto > 0),
  archivo_path text not null,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobado', 'rechazado')),
  created_at timestamptz not null default now(),
  revisado_at timestamptz
);

create index if not exists comprobantes_pago_estado_idx on public.comprobantes_pago (estado, created_at);

alter table public.comprobantes_pago enable row level security;

drop policy if exists "comprobantes: alumno ve los suyos" on public.comprobantes_pago;
create policy "comprobantes: alumno ve los suyos"
  on public.comprobantes_pago for select
  to authenticated
  using (alumno_id = auth.uid());

drop policy if exists "comprobantes: admin ve todo" on public.comprobantes_pago;
create policy "comprobantes: admin ve todo"
  on public.comprobantes_pago for select
  to authenticated
  using (public.is_admin());

grant select on public.comprobantes_pago to authenticated;
grant all on public.comprobantes_pago to service_role;

-- El alumno registra su comprobante solo por esta funcion: calcula el tramo
-- y el monto desde la compra (no se confia en lo que mande el navegador).
create or replace function public.registrar_comprobante(p_compra_id uuid, p_archivo_path text)
returns public.comprobantes_pago
language plpgsql
security definer set search_path = public
as $$
declare
  v_compra public.compras_paquete;
  v_tramo text;
  v_monto numeric(10, 2);
  v_comprobante public.comprobantes_pago;
begin
  select * into v_compra from public.compras_paquete
  where id = p_compra_id and alumno_id = auth.uid() and estado <> 'cancelado';

  if v_compra.id is null then
    raise exception 'No encontramos ese paquete';
  end if;

  if v_compra.estado = 'pagado' then
    raise exception 'Ese paquete ya esta pagado';
  end if;

  if p_archivo_path is null or split_part(p_archivo_path, '/', 1) <> auth.uid()::text then
    raise exception 'Archivo no valido';
  end if;

  if exists (select 1 from public.comprobantes_pago where compra_id = p_compra_id and estado = 'pendiente') then
    raise exception 'Ya enviaste un comprobante, lo estamos revisando';
  end if;

  if v_compra.estado = 'parcial' then
    v_tramo := 'segunda_mitad';
    v_monto := v_compra.precio - round(v_compra.precio / 2, 2);
  elsif v_compra.modalidad_pago = 'medio_medio' then
    v_tramo := 'primera_mitad';
    v_monto := round(v_compra.precio / 2, 2);
  else
    v_tramo := 'total';
    v_monto := v_compra.precio;
  end if;

  insert into public.comprobantes_pago (compra_id, alumno_id, tramo, monto, archivo_path)
  values (p_compra_id, auth.uid(), v_tramo, v_monto, p_archivo_path)
  returning * into v_comprobante;

  return v_comprobante;
end;
$$;

-- El admin aprueba o rechaza. Aprobar actualiza la compra, y el trigger de
-- fix-18 registra el ingreso en finanzas.
create or replace function public.revisar_comprobante(p_comprobante_id uuid, p_aprobar boolean)
returns public.comprobantes_pago
language plpgsql
security definer set search_path = public
as $$
declare
  v_comprobante public.comprobantes_pago;
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  update public.comprobantes_pago
  set estado = case when p_aprobar then 'aprobado' else 'rechazado' end,
      revisado_at = now()
  where id = p_comprobante_id and estado = 'pendiente'
  returning * into v_comprobante;

  if v_comprobante.id is null then
    raise exception 'Ese comprobante ya fue revisado';
  end if;

  if p_aprobar then
    update public.compras_paquete
    set estado = case when v_comprobante.tramo = 'primera_mitad' then 'parcial'::public.estado_compra
                      else 'pagado'::public.estado_compra end
    where id = v_comprobante.compra_id and estado <> 'cancelado';
  end if;

  return v_comprobante;
end;
$$;

revoke execute on function public.registrar_comprobante(uuid, text) from public, anon;
revoke execute on function public.revisar_comprobante(uuid, boolean) from public, anon;
grant execute on function public.registrar_comprobante(uuid, text) to authenticated;
grant execute on function public.revisar_comprobante(uuid, boolean) to authenticated;

-- Carpeta privada para las capturas: cada alumno sube solo dentro de su
-- propia carpeta (<su id>/...), y solo el admin y el dueño las pueden ver.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('comprobantes', 'comprobantes', false, 6291456,
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])
on conflict (id) do nothing;

drop policy if exists "comprobantes: alumno sube a su carpeta" on storage.objects;
create policy "comprobantes: alumno sube a su carpeta"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'comprobantes' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "comprobantes: dueño o admin leen" on storage.objects;
create policy "comprobantes: dueño o admin leen"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'comprobantes'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
