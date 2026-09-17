-- Fix 17: hasta ahora, cuando una clase no se daba, el profesor solo podia
-- marcar "no asistio" (culpa del alumno, consume su cupo -- ver fix-13). No
-- habia forma de reflejar que la clase no se dio porque el PROFESOR no pudo
-- ir (carro malogrado, imprevisto, etc). Se agrega un tercer estado para
-- ese caso: no consume el cupo del alumno y no necesita que el admin lo
-- perdone despues (ver /admin/alumnos) -- se libera solo, porque no fue
-- falta del alumno.
alter type public.estado_reserva add value 'profesor_no_asistio';
