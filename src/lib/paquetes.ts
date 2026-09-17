import type { Paquete } from "@/lib/types";

// Linea corta bajo el precio: "12 h + 1h circuito · 6 clases de 2h"
export function subtituloPaquete(p: Paquete) {
  const circuito = p.horas_circuito > 0 ? ` + ${p.horas_circuito}h circuito` : "";
  return `${p.horas_practica} h${circuito} · ${p.num_clases} clases de 2h`;
}

// Lista de tics: hechos concretos, no frases de marketing.
export function ticksPaquete(p: Paquete): string[] {
  const ticks = [
    `${p.horas_practica} horas de práctica al volante`,
    `${p.num_clases} clases de 2 horas`,
  ];
  if (p.horas_circuito > 0) {
    ticks.push(`${p.horas_circuito}h en circuito alterno de Marbal, Ventanilla`);
  }
  if (p.incluye_examen_medico) {
    ticks.push("Examen médico para tu brevete");
  }
  if (p.incluye_traslado) {
    ticks.push("Traslado ida y vuelta el día del examen práctico");
  }
  return ticks;
}
