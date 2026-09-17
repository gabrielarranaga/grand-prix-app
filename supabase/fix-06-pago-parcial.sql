-- Parche 6: agrega el estado "parcial" (50% pagado) al enum de compras.
-- pendiente -> parcial (50%) -> pagado (100%). parcial y pagado desbloquean
-- horarios/agenda para ese alumno. La policy de admin ya permite actualizar
-- el estado (compras: admin gestiona todo), no hace falta una policy nueva.

alter type public.estado_compra add value if not exists 'parcial';
