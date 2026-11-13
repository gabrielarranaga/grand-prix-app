-- Fix 23: dos arreglos.
--
-- 1) "No pude asistir" del instructor daba "invalid input value for enum":
--    el estado 'profesor_no_asistio' (fix-17) nunca se habia creado en esta base.
-- 2) El alumno ahora puede cancelar una clase hasta 2 horas antes (antes eran 4).
--    Si cancela con menos tiempo, el instructor la marca como falta y el admin
--    la puede perdonar despues desde Alumnos.

alter type public.estado_reserva add value if not exists 'profesor_no_asistio';

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

  if ((v_horario.fecha + v_horario.hora_inicio) at time zone 'America/Lima') - now() < interval '2 hours' then
    raise exception 'Ya no se puede cancelar, faltan menos de 2 horas para la clase';
  end if;

  update public.reservas set estado = 'cancelada' where id = p_reserva_id returning * into v_reserva;
  update public.horarios_clase set estado = 'disponible' where id = v_horario.id;

  return v_reserva;
end;
$$;
