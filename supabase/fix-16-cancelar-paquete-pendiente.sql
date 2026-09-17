-- Fix 16: si el alumno elige un paquete y se arrepiente ANTES de pagar
-- (estado 'pendiente'), ahora se lo puede cancelar el mismo desde la app
-- para elegir otro. No hay policy de UPDATE para "compras_paquete" del lado
-- del alumno todavia, asi que hace falta una -- bien acotada: solo puede
-- pasar de 'pendiente' a 'cancelado' en su propia fila, nada mas (no puede
-- tocar una compra ya parcial/pagada, eso sigue siendo solo por WhatsApp).
create policy "compras: alumno cancela su compra pendiente"
  on public.compras_paquete for update
  to authenticated
  using (alumno_id = auth.uid() and estado = 'pendiente')
  with check (alumno_id = auth.uid() and estado = 'cancelado');
