-- Fix 22: el admin cancela una clase por emergencia (del alumno o del instructor).
--
-- Hasta ahora un alumno solo podia cancelar con mas de 4 horas de anticipacion,
-- y un instructor solo podia marcar "No pude ir" cuando la clase ya habia
-- pasado. Con una emergencia de ultimo momento no habia forma de liberar el
-- cupo ni de devolverle la clase al alumno antes de la hora.
--
-- Esta funcion la usa solo el admin: la clase queda 'cancelada' (no cuenta
-- contra las clases del paquete, igual que una cancelacion normal), el cupo
-- vuelve a quedar libre en el acto y se guarda el motivo.
-- Correr DESPUES de fix-21.

alter table public.reservas add column if not exists motivo_cancelacion text;

create or replace function public.admin_cancelar_clase(p_reserva_id uuid, p_motivo text)
returns public.reservas
language plpgsql
security definer set search_path = public
as $$
declare
  v_reserva public.reservas;
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  if p_motivo not in ('alumno', 'instructor', 'otro') then
    raise exception 'Motivo no valido';
  end if;

  select * into v_reserva from public.reservas where id = p_reserva_id for update;

  if v_reserva.id is null then
    raise exception 'Reserva no encontrada';
  end if;

  if v_reserva.estado <> 'confirmada' then
    raise exception 'Esta clase ya no se puede cancelar';
  end if;

  update public.reservas
  set estado = 'cancelada', motivo_cancelacion = p_motivo
  where id = p_reserva_id
  returning * into v_reserva;

  update public.horarios_clase set estado = 'disponible' where id = v_reserva.horario_clase_id;

  return v_reserva;
end;
$$;

revoke execute on function public.admin_cancelar_clase(uuid, text) from public, anon;
grant execute on function public.admin_cancelar_clase(uuid, text) to authenticated;
