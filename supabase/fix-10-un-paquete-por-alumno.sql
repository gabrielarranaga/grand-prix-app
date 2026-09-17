-- Fix 10: un alumno solo puede tener UN paquete activo a la vez (pendiente,
-- parcial o pagado). Si quiere cambiarlo, primero hay que cancelar el que
-- tiene. Esto lo frena tambien a nivel de base de datos, no solo en la app.

create unique index if not exists compras_paquete_alumno_activa_unica
  on public.compras_paquete (alumno_id)
  where estado <> 'cancelado';
