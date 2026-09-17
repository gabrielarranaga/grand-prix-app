-- Parche para el proyecto de Supabase que ya corrio el schema.sql original.
-- Corrige: recursion infinita en las policies "... admin gestiona todo" y
-- agrega los grants de tabla que faltaban para service_role.
-- Se puede correr una sola vez; es seguro volver a correrlo si hiciera falta.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and rol = 'admin');
$$;

create or replace function public.prevent_self_role_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_es_admin boolean;
begin
  if new.rol is distinct from old.rol then
    select public.is_admin() into v_es_admin;
    if not v_es_admin then
      new.rol := old.rol;
    end if;
  end if;
  return new;
end;
$$;

drop policy if exists "profiles: admin gestiona todo" on public.profiles;
create policy "profiles: admin gestiona todo"
  on public.profiles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "disponibilidad: admin gestiona todo" on public.disponibilidad_profesor;
create policy "disponibilidad: admin gestiona todo"
  on public.disponibilidad_profesor for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "horarios: admin gestiona todo" on public.horarios_clase;
create policy "horarios: admin gestiona todo"
  on public.horarios_clase for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "reservas: admin gestiona todo" on public.reservas;
create policy "reservas: admin gestiona todo"
  on public.reservas for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete
  on public.profiles, public.disponibilidad_profesor, public.horarios_clase, public.reservas
  to authenticated;

grant all
  on public.profiles, public.disponibilidad_profesor, public.horarios_clase, public.reservas
  to service_role;
