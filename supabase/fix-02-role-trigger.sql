-- Parche 2: el trigger anti-auto-escalacion de rol bloqueaba tambien los
-- cambios hechos con la service role key (p.ej. el admin convirtiendo un
-- alumno en profesor desde el panel). Ahora solo bloquea cuando hay un
-- usuario final logueado que no es admin.

create or replace function public.prevent_self_role_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.rol is distinct from old.rol and auth.uid() is not null and not public.is_admin() then
    new.rol := old.rol;
  end if;
  return new;
end;
$$;
