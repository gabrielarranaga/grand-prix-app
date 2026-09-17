-- Fix 07: modalidad de pago (al contado / 50-50) + limite de clases por paquete.
--
-- 1. compras_paquete gana "modalidad_pago" para saber si el alumno pago todo
--    de una vez o en dos partes (50% ahora, 50% a mitad del curso).
-- 2. reservar_clase ahora respeta cuantas clases incluye el/los paquete(s)
--    que el alumno tiene activos (estado parcial o pagado): no lo deja
--    reservar mas clases de las que su paquete incluye.

alter table public.compras_paquete
  add column if not exists modalidad_pago text;

create or replace function public.reservar_clase(p_horario_id uuid)
returns public.reservas
language plpgsql
security definer set search_path = public
as $$
declare
  v_estado public.estado_horario;
  v_reserva public.reservas;
  v_clases_incluidas integer;
  v_clases_usadas integer;
begin
  select estado into v_estado
  from public.horarios_clase
  where id = p_horario_id
  for update;

  if v_estado is null then
    raise exception 'El horario no existe';
  end if;

  if v_estado <> 'disponible' then
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

  insert into public.reservas (alumno_id, horario_clase_id, estado)
  values (auth.uid(), p_horario_id, 'confirmada')
  returning * into v_reserva;

  update public.horarios_clase
  set estado = 'reservado'
  where id = p_horario_id;

  return v_reserva;
end;
$$;
