-- Parche 3: agrega paquetes y compras_paquete al proyecto que ya corrio
-- schema.sql + fix-01 + fix-02.

create type public.estado_compra as enum ('pendiente', 'pagado', 'cancelado');

create table public.paquetes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion_horas text not null,
  caracteristicas text[] not null default '{}',
  precio numeric(10, 2) not null,
  destacado boolean not null default false,
  orden smallint not null default 0,
  activo boolean not null default true
);

alter table public.paquetes enable row level security;

create policy "paquetes: lectura autenticada"
  on public.paquetes for select
  to authenticated
  using (true);

create policy "paquetes: admin gestiona todo"
  on public.paquetes for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into public.paquetes (nombre, descripcion_horas, caracteristicas, precio, destacado, orden) values
  ('Académico', '8 h · 4 clases de 2h',
    array['Solo práctica al volante', 'Flota propia mecánica y automática'], 360, false, 1),
  ('Básico', '10 h · 5 clases de 2h',
    array['Solo práctica al volante', '2 horas adicionales de manejo'], 430, false, 2),
  ('Standard', '12 h + 1h circuito · 6 clases de 2h',
    array['Práctica + 1h en circuito alterno de Marbal, Ventanilla', 'Ideal para ganar seguridad antes del examen'], 500, false, 3),
  ('Integral', '14 h + 2h circuito · 7 clases de 2h',
    array['Todo lo del paquete Standard', 'Examen médico para tu brevete', 'Traslado ida y vuelta a Marbal, Ventanilla el día del examen práctico'], 920, true, 4);

create table public.compras_paquete (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references public.profiles (id) on delete cascade,
  paquete_id uuid not null references public.paquetes (id),
  precio numeric(10, 2) not null,
  metodo_pago text,
  estado public.estado_compra not null default 'pendiente',
  fecha_creacion timestamptz not null default now()
);

create index compras_paquete_alumno_idx on public.compras_paquete (alumno_id);

alter table public.compras_paquete enable row level security;

create policy "compras: alumno ve las suyas"
  on public.compras_paquete for select
  to authenticated
  using (alumno_id = auth.uid());

create policy "compras: alumno crea las suyas"
  on public.compras_paquete for insert
  to authenticated
  with check (alumno_id = auth.uid());

create policy "compras: admin gestiona todo"
  on public.compras_paquete for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update, delete on public.paquetes, public.compras_paquete to authenticated;
grant all on public.paquetes, public.compras_paquete to service_role;
