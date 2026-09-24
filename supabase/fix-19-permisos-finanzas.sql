-- Fix 19: este proyecto de Supabase no otorga permisos automaticos sobre
-- tablas nuevas, asi que las de fix-18 quedaron inaccesibles incluso para el
-- admin ("permission denied"). Se otorgan solo a usuarios logueados y al
-- backend; quien ve o toca que filas lo sigue decidiendo el RLS (solo admin).
-- "anon" (visitante sin sesion) queda sin acceso a proposito.

grant select, insert, update, delete on public.categorias_financieras to authenticated;
grant select, insert, update, delete on public.movimientos_financieros to authenticated;
grant all on public.categorias_financieras to service_role;
grant all on public.movimientos_financieros to service_role;

revoke execute on function public.resumen_financiero(date, int) from public, anon;
grant execute on function public.resumen_financiero(date, int) to authenticated, service_role;
