-- Parche 4: saca la frase de relleno ("Ideal para ganar seguridad...") del
-- paquete Standard, dejando solo el beneficio concreto.

update public.paquetes
set caracteristicas = array['Práctica + 1h en circuito alterno de Marbal, Ventanilla']
where nombre = 'Standard';
