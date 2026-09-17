-- Fix 13: una clase marcada como "no_show" (el alumno no llego) debia
-- seguir contando como clase consumida de su paquete. Antes solo se
-- contaban 'confirmada' y 'completada', asi que un no-show le devolvia la
-- clase gratis al alumno (podia reservar otra sin pagar de nuevo), aunque
-- el instructor y el carro ya se usaron.

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
    and r.estado in ('confirmada', 'completada', 'no_show');

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
  v_clases_incluidas integer;
  v_clases_usadas integer;
begin
  if not public.is_admin() then
    raise exception 'No autorizado';
  end if;

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
  where c.alumno_id = p_alumno_id
    and c.estado in ('parcial', 'pagado');

  select count(*) into v_clases_usadas
  from public.reservas r
  where r.alumno_id = p_alumno_id
    and r.estado in ('confirmada', 'completada', 'no_show');

  if v_clases_usadas >= v_clases_incluidas then
    raise exception 'Ese alumno ya reservo todas las clases incluidas en su paquete';
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
  values (p_alumno_id, v_horario.id, 'confirmada')
  returning * into v_reserva;

  return v_reserva;
end;
$$;
