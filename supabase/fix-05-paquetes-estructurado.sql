-- Parche 5: convierte "descripcion_horas" y "caracteristicas" (texto libre)
-- en columnas estructuradas, para poder mostrar horas/clases/circuito como
-- una lista de tics en vez de frases armadas a mano.

alter table public.paquetes
  add column if not exists horas_practica smallint,
  add column if not exists num_clases smallint,
  add column if not exists horas_circuito smallint not null default 0,
  add column if not exists incluye_examen_medico boolean not null default false,
  add column if not exists incluye_traslado boolean not null default false;

update public.paquetes set horas_practica = 8, num_clases = 4 where nombre = 'Académico';
update public.paquetes set horas_practica = 10, num_clases = 5 where nombre = 'Básico';
update public.paquetes set horas_practica = 12, num_clases = 6, horas_circuito = 1 where nombre = 'Standard';
update public.paquetes
  set horas_practica = 14, num_clases = 7, horas_circuito = 2,
      incluye_examen_medico = true, incluye_traslado = true
  where nombre = 'Integral';

alter table public.paquetes
  alter column horas_practica set not null,
  alter column num_clases set not null;

alter table public.paquetes
  drop column if exists descripcion_horas,
  drop column if exists caracteristicas;
