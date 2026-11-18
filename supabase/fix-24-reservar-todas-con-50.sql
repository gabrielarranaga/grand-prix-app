-- Fix 24: con CUALQUIER pago (aunque sea el 50%) el alumno puede reservar TODAS las clases de su paquete.
--
-- Antes (fix-21): con el 50% pagado ('parcial') solo se podia reservar la mitad de las clases
-- y el resto quedaba bloqueado hasta el segundo pago.
-- Ahora: 'parcial' y 'pagado' permiten reservar todas. El segundo 50% se sigue cobrando por
-- WhatsApp a mitad de curso y el admin lo marca en Pagos, pero ya no bloquea horarios.
--
-- Correr completo en el SQL Editor de Supabase (una sola vez).

create or replace function public.clases_permitidas(p_alumno uuid)
returns integer
language sql
stable
security definer set search_path = public
as $$
  select coalesce(sum(p.num_clases), 0)::int
  from public.compras_paquete c
  join public.paquetes p on p.id = c.paquete_id
  where c.alumno_id = p_alumno and c.estado in ('parcial', 'pagado');
$$;

revoke execute on function public.clases_permitidas(uuid) from public, anon;
