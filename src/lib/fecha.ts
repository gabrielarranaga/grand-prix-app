// El servidor (Vercel) corre en UTC; las fechas del negocio se calculan en
// hora de Lima para no desfasarse un dia segun a que hora corra el servidor.
export function fechaLima(offsetDias = 0) {
  const formateador = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const fecha = new Date(Date.now() + offsetDias * 24 * 60 * 60 * 1000);
  return formateador.format(fecha); // en-CA => YYYY-MM-DD
}

// Lima no tiene horario de verano: UTC-5 todo el año, por eso el offset fijo.
export function instanteLima(fecha: string, hora: string) {
  return new Date(`${fecha}T${hora}-05:00`);
}

// Envuelve Date.now(): el linter de React marca las llamadas directas a
// funciones impuras dentro de un componente, aunque estos sean Server
// Components que solo corren una vez por request.
export function ahora() {
  return Date.now();
}
