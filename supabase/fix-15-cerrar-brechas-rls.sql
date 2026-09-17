-- Fix 15: cierra 2 brechas donde el RLS era mas permisivo de lo que la app
-- necesitaba, permitiendo saltarse las reglas de negocio llamando directo a
-- la API de Supabase (con la anon key, que es publica) en vez de pasar por
-- las Server Actions o funciones RPC que sí validan todo.

-- 1) "compras_paquete": el alumno podia insertar su propia compra con
-- CUALQUIER estado (incluido 'pagado') y CUALQUIER precio -- sin pasar por
-- "elegirPaquete" (que fuerza estado='pendiente' y el precio real). Eso
-- permitia desbloquear clases gratis con una sola llamada a la API.
drop policy "compras: alumno crea las suyas" on public.compras_paquete;

create policy "compras: alumno crea las suyas"
  on public.compras_paquete for insert
  to authenticated
  with check (alumno_id = auth.uid() and estado = 'pendiente');

create function public.forzar_precio_real_paquete()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    select precio into new.precio from public.paquetes where id = new.paquete_id;
  end if;
  return new;
end;
$$;

create trigger before_compra_insert
  before insert on public.compras_paquete
  for each row execute function public.forzar_precio_real_paquete();

-- 2) "reservas": existia una policy de UPDATE que dejaba al alumno cambiar
-- CUALQUIER columna de su propia reserva (estado, o incluso a que horario
-- apunta) directo por API, saltandose cancelar_reserva() (que sí respeta
-- el limite de 4 horas y libera el horario). La funcion es SECURITY
-- DEFINER, asi que cancelar sigue funcionando igual sin esta policy --
-- solo se cierra el atajo que la rodeaba.
drop policy "reservas: alumno cancela las suyas" on public.reservas;
