// Opciones de "¿Como nos conociste?" en el registro. El valor se guarda en
// profiles.origen y el admin ve el conteo por origen en su resumen.
export const ORIGENES_ALUMNO = [
  { valor: "google", etiqueta: "Google o Google Maps" },
  { valor: "instagram", etiqueta: "Instagram" },
  { valor: "facebook", etiqueta: "Facebook" },
  { valor: "tiktok", etiqueta: "TikTok" },
  { valor: "anuncio", etiqueta: "Un anuncio" },
  { valor: "recomendacion", etiqueta: "Me lo recomendaron" },
  { valor: "paso_por_ahi", etiqueta: "Pasé por la oficina" },
  { valor: "otro", etiqueta: "Otro" },
] as const;

export function etiquetaOrigen(valor: string | null) {
  return ORIGENES_ALUMNO.find((o) => o.valor === valor)?.etiqueta ?? "Sin dato";
}
