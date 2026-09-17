-- Fix 14: la base de datos para recordatorios automaticos de clase (2 horas
-- antes). El envio real (WhatsApp + correo) lo dispara un cron fuera de la
-- base de datos -- ver src/app/api/cron/recordatorios/route.ts.
--
-- (El sistema de referidos que vivia en este mismo archivo se quito por
-- ahora -- ver fix-14-referidos-y-recordatorios.sql.old si hace falta
-- retomarlo.)

alter table public.reservas
  add column recordatorio_enviado boolean not null default false;

-- Un solo lugar de encuentro para toda la escuela (hoy solo opera un carro).
-- Si mas adelante hay mas de un carro/instructor en paralelo, esto tendria
-- que pasar a ser por horario/profesor en vez de un valor unico global.
create table public.configuracion_negocio (
  id boolean primary key default true check (id),
  punto_encuentro_texto text,
  punto_encuentro_maps_link text
);

insert into public.configuracion_negocio (id) values (true);

alter table public.configuracion_negocio enable row level security;

create policy "configuracion: lectura autenticada"
  on public.configuracion_negocio for select
  to authenticated
  using (true);

create policy "configuracion: admin edita"
  on public.configuracion_negocio for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Lee reservas a 1h50-2h de empezar y que todavia no mandaron recordatorio.
-- security definer porque necesita el email (vive en auth.users, no en
-- profiles) y esto lo llama el cron con la service role.
create function public.recordatorios_pendientes()
returns table (
  reserva_id uuid,
  alumno_nombre text,
  alumno_telefono text,
  alumno_email text,
  fecha date,
  hora_inicio time,
  instructor_nombre text,
  punto_encuentro_texto text,
  punto_encuentro_maps_link text
)
language sql
security definer set search_path = public, auth
stable
as $$
  select
    r.id,
    a.nombre,
    a.telefono,
    u.email,
    h.fecha,
    h.hora_inicio,
    p.nombre,
    cfg.punto_encuentro_texto,
    cfg.punto_encuentro_maps_link
  from public.reservas r
  join public.horarios_clase h on h.id = r.horario_clase_id
  join public.profiles a on a.id = r.alumno_id
  join auth.users u on u.id = a.id
  left join public.profiles p on p.id = h.profesor_id
  left join public.configuracion_negocio cfg on true
  where r.estado = 'confirmada'
    and r.recordatorio_enviado = false
    and (h.fecha + h.hora_inicio) between (now() + interval '1 hour 50 minutes') and (now() + interval '2 hours');
$$;

grant execute on function public.recordatorios_pendientes() to service_role;

grant select, insert, update, delete on public.configuracion_negocio to authenticated;
grant all on public.configuracion_negocio to service_role;
