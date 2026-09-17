-- Fix 09: bloquear_horario trataba cualquier fila existente (incluidas las
-- viejas filas 'disponible' que quedaron de antes del cronograma fijo) como
-- si ya estuviera ocupada. Ahora una fila 'disponible' se puede bloquear
-- igual (se actualiza a 'bloqueado'); solo una que ya este 'reservado' o
-- 'bloqueado' frena el bloqueo.

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
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

  select * into v_horario
  from public.horarios_clase
  where fecha = p_fecha and hora_inicio = p_hora_inicio and estado <> 'cancelado'
  for update;

  if v_horario.id is not null and v_horario.estado <> 'disponible' then
    raise exception 'Ese horario ya tiene una reserva o un bloqueo';
  end if;

  if v_horario.id is null then
    insert into public.horarios_clase (fecha, hora_inicio, hora_fin, estado)
    values (p_fecha, p_hora_inicio, p_hora_fin, 'bloqueado')
    returning * into v_horario;
  else
    update public.horarios_clase set estado = 'bloqueado' where id = v_horario.id
    returning * into v_horario;
  end if;

  return v_horario;
end;
$$;
