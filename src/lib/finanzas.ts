import { fechaLima } from "@/lib/fecha";

export type TipoMovimiento = "ingreso" | "egreso";

export type CategoriaFinanciera = {
  id: string;
  nombre: string;
  tipo: TipoMovimiento;
  activa: boolean;
};

export type MovimientoFinanciero = {
  id: string;
  fecha: string;
  tipo: TipoMovimiento;
  categoria_id: string;
  monto: number;
  notas: string | null;
  compra_id: string | null;
};

// Fila de la funcion resumen_financiero() de la base de datos.
export type FilaResumen = {
  mes: string; // YYYY-MM-01
  tipo: TipoMovimiento;
  categoria_id: string;
  categoria: string;
  total: number;
};

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

// "2026-09" del mes actual en hora de Lima.
export function mesActual() {
  return fechaLima(0).slice(0, 7);
}

export function esMesValido(mes: string | undefined): mes is string {
  return !!mes && /^\d{4}-(0[1-9]|1[0-2])$/.test(mes);
}

// Suma (o resta) meses a "YYYY-MM" sin pasar por Date, para no depender de
// la zona horaria del servidor.
export function sumarMeses(mes: string, delta: number) {
  const [anio, m] = mes.split("-").map(Number);
  const total = anio * 12 + (m - 1) + delta;
  const nuevoAnio = Math.floor(total / 12);
  const nuevoMes = (total % 12) + 1;
  return `${nuevoAnio}-${String(nuevoMes).padStart(2, "0")}`;
}

export function nombreMes(mes: string, corto = false) {
  const [anio, m] = mes.split("-").map(Number);
  const nombre = MESES[m - 1];
  return corto ? `${nombre.slice(0, 3)} ${String(anio).slice(2)}` : `${nombre} ${anio}`;
}

export function ultimoDiaMes(mes: string) {
  const [anio, m] = mes.split("-").map(Number);
  const dias = new Date(Date.UTC(anio, m, 0)).getUTCDate();
  return `${mes}-${String(dias).padStart(2, "0")}`;
}

const formateadorSoles = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function soles(monto: number) {
  return formateadorSoles.format(monto);
}

// Cambio porcentual vs. el mes anterior. null cuando el mes anterior fue 0
// (no hay base con que comparar, "infinito %" no le dice nada a nadie).
export function variacion(actual: number, anterior: number) {
  if (anterior === 0) return null;
  return ((actual - anterior) / Math.abs(anterior)) * 100;
}
