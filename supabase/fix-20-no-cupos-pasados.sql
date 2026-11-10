-- Fix 20: no se pueden reservar, asignar ni bloquear cupos que ya empezaron.
--
-- Hasta ahora la app mostraba como "Disponible" los dias ya pasados de la
-- semana (lunes a jueves, estando en viernes) y ni la app ni la base lo
-- impedian: un alumno podia gastar una clase de su paquete en una fecha
-- pasada, y el admin podia asignar o bloquear cupos pasados.
--
-- Una sola regla en la tabla cubre los tres caminos (reservar_clase_en_fecha,
-- asignar_clase_a_alumno y bloquear_horario), y tambien a quien llame directo
-- a la API: toda fila que PASA a 'reservado' o 'bloqueado' tiene que ser de un
-- cupo que todavia no empieza (hora de Lima).
--
-- No afecta a lo ya registrado: una clase pasada que ya estaba reservada puede
-- seguir marcandose como completada / no asistio, y un bloqueo viejo puede
-- abrirse de nuevo. Quien no tiene sesion de usuario (el editor SQL, tareas de
-- mantenimiento con la service role) queda fuera de la regla.

create or replace function public.validar_cupo_no_pasado()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if new.estado in ('reservado', 'bloqueado')
     and (tg_op = 'INSERT' or old.estado is distinct from new.estado)
     and ((new.fecha + new.hora_inicio) at time zone 'America/Lima') <= now() then
    raise exception 'Ese horario ya paso';
  end if;

  return new;
end;
$$;

drop trigger if exists before_horario_no_pasado on public.horarios_clase;

create trigger before_horario_no_pasado
  before insert or update on public.horarios_clase
  for each row execute function public.validar_cupo_no_pasado();
