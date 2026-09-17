import { fechaLima } from "@/lib/fecha";

// Franjas horarias fijas del negocio (bloques de 2h): siempre las mismas,
// Lun-Sab. El cronograma del alumno y el del admin arman sus filas a partir
// de esta misma lista — asi ambos lados siempre coinciden.
export const FRANJAS_HORARIAS = [
  { inicio: "08:00", fin: "10:00" },
  { inicio: "10:00", fin: "12:00" },
  { inicio: "12:00", fin: "14:00" },
  { inicio: "14:00", fin: "16:00" },
  { inicio: "16:00", fin: "18:00" },
  { inicio: "18:00", fin: "20:00" },
] as const;

// "08:00" -> "8:00 a.m." / "18:00" -> "6:00 p.m." — el cronograma solo usaba
// formato 24h y eso confundia a los alumnos con las franjas de la tarde.
export function hora12(hora24: string) {
  const [hStr, m] = hora24.split(":");
  const h = Number(hStr);
  const sufijo = h >= 12 ? "p.m." : "a.m.";
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${sufijo}`;
}

export const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const;

// Fecha (YYYY-MM-DD) del lunes de "hoy + offsetSemanas semanas", en hora Lima.
function lunesDeLaSemana(offsetSemanas: number) {
  const hoy = fechaLima();
  const [y, m, d] = hoy.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  const diaSemana = base.getUTCDay(); // 0=domingo..6=sabado
  const diffALunes = diaSemana === 0 ? -6 : 1 - diaSemana;
  base.setUTCDate(base.getUTCDate() + diffALunes + offsetSemanas * 7);
  return base;
}

function toISO(fecha: Date) {
  return fecha.toISOString().slice(0, 10);
}

export function formatearFechaCorta(fecha: Date) {
  return fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "short", timeZone: "UTC" });
}

// Lun-Sab de la semana "hoy + offsetSemanas semanas": usado tanto por el
// cronograma del alumno como por el del admin, para que ambos armen
// exactamente la misma grilla de dias.
export function diasDeLaSemana(offsetSemanas: number) {
  const lunes = lunesDeLaSemana(offsetSemanas);
  return DIAS_SEMANA.map((label, i) => {
    const fecha = new Date(lunes);
    fecha.setUTCDate(lunes.getUTCDate() + i);
    return { label, fecha, iso: toISO(fecha) };
  });
}
