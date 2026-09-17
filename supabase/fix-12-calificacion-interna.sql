-- Fix 12: calificacion interna del alumno (1-5 estrellas + comentario
-- opcional), que se pide una sola vez por alumno a partir de su 3ra clase
-- completada. Esto es interno (para que el negocio vea feedback), separado
-- de la resena publica en Google.

create table public.calificaciones_alumno (
  id uuid primary key default gen_random_uuid(),
  alumno_id uuid not null references public.profiles (id) on delete cascade,
  estrellas smallint not null check (estrellas between 1 and 5),
  comentario text,
  fecha_creacion timestamptz not null default now()
);

-- Una sola calificacion por alumno.
create unique index calificaciones_alumno_unica on public.calificaciones_alumno (alumno_id);

alter table public.calificaciones_alumno enable row level security;

create policy "calificaciones: alumno ve la suya"
  on public.calificaciones_alumno for select
  to authenticated
  using (alumno_id = auth.uid());

create policy "calificaciones: alumno crea la suya"
  on public.calificaciones_alumno for insert
  to authenticated
  with check (alumno_id = auth.uid());

create policy "calificaciones: admin ve todo"
  on public.calificaciones_alumno for select
  to authenticated
  using (public.is_admin());

grant select, insert on public.calificaciones_alumno to authenticated;
grant all on public.calificaciones_alumno to service_role;
