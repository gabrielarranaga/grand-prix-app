-- Fix 08: el horario deja de ser "el admin crea cada clase a mano" y pasa a
-- ser un cronograma FIJO que se repite siempre igual (Lun-Sab, 6 franjas).
-- Por defecto todo esta disponible; el admin solo bloquea excepciones
-- (vacaciones, dias que no atienden). horarios_clase ahora solo guarda filas
-- para lo que es distinto del default: una clase reservada, o un bloqueo.

-- Ya no se elige un profesor al crear el horario (el cronograma es el mismo
-- para todos); se hace opcional.
alter table public.horarios_clase
  alter column profesor_id drop not null;

-- Nuevo estado: el admin cerro esta franja (vacaciones, no atienden ese dia).
alter type public.estado_horario add value if not exists 'bloqueado';

-- A lo mas una fila "activa" (no cancelada) por fecha+hora: evita choques
-- entre una reserva y un bloqueo sobre el mismo cupo.
create unique index if not exists horarios_clase_fecha_hora_activa_unica
  on public.horarios_clase (fecha, hora_inicio)
  where estado <> 'cancelado';

-- La funcion vieja reservaba por id de un horario ya creado por el admin.
-- Ya no aplica: ahora se reserva por fecha+hora directamente, creando la
-- fila en el momento si no existia (cronograma fijo = todo disponible salvo
-- que haya una fila diciendo lo contrario).
drop function if exists public.reservar_clase(uuid);

create function public.reservar_clase_en_fecha(
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
  v_clases_incluidas integer;
  v_clases_usadas integer;
begin
  select * into v_horario
  from public.horarios_clase
  where fecha = p_fecha and hora_inicio = p_hora_inicio and estado <> 'cancelado'
  for update;

  if v_horario.id is not null and v_horario.estado <> 'disponible' then
    raise exception 'Ese horario ya no esta disponible';
  end if;

  select coalesce(sum(p.num_clases), 0) into v_clases_incluidas
  from public.compras_paquete c
  join public.paquetes p on p.id = c.paquete_id
  where c.alumno_id = auth.uid()
    and c.estado in ('parcial', 'pagado');

  select count(*) into v_clases_usadas
  from public.reservas r
  where r.alumno_id = auth.uid()
    and r.estado in ('confirmada', 'completada');

  if v_clases_usadas >= v_clases_incluidas then
    raise exception 'Ya reservaste todas las clases incluidas en tu paquete';
  end if;

  begin
    if v_horario.id is null then
      insert into public.horarios_clase (fecha, hora_inicio, hora_fin, estado)
      values (p_fecha, p_hora_inicio, p_hora_fin, 'reservado')
      returning * into v_horario;
    else
      update public.horarios_clase set estado = 'reservado' where id = v_horario.id;
    end if;
  exception when unique_violation then
    raise exception 'Ese horario ya no esta disponible';
  end;

  insert into public.reservas (alumno_id, horario_clase_id, estado)
  values (auth.uid(), v_horario.id, 'confirmada')
  returning * into v_reserva;

  return v_reserva;
end;
$$;

grant execute on function public.reservar_clase_en_fecha(date, time, time) to authenticated;

-- Funcion RPC: el admin bloquea una franja (vacaciones, no atienden).
create function public.bloquear_horario(
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

  if v_horario.id is not null then
    raise exception 'Ese horario ya tiene una reserva o un bloqueo';
  end if;

  insert into public.horarios_clase (fecha, hora_inicio, hora_fin, estado)
  values (p_fecha, p_hora_inicio, p_hora_fin, 'bloqueado')
  returning * into v_horario;

  return v_horario;
end;
$$;

grant execute on function public.bloquear_horario(date, time, time) to authenticated;
