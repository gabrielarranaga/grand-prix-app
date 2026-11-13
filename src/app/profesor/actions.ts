"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type MarcarFormState = { error: string | null };

export async function marcarClase(
  reservaId: string,
  horarioId: string,
  resultado: "completada" | "no_show" | "profesor_no_asistio",
  _prevState: MarcarFormState,
  _formData: FormData,
): Promise<MarcarFormState> {
  await requireProfile("profesor");

  const supabase = await createClient();

  // Corregir una marca: si antes fue "no pude asistir", el horario se libero y
  // quizas otro alumno ya lo tomo; en ese caso no se puede revertir.
  const { data: actual } = await supabase
    .from("reservas")
    .select("estado, horario:horarios_clase(estado)")
    .eq("id", reservaId)
    .maybeSingle<{ estado: string; horario: { estado: string } | null }>();

  if (actual?.estado === "profesor_no_asistio" && resultado !== "profesor_no_asistio") {
    const { count } = await supabase
      .from("reservas")
      .select("id", { count: "exact", head: true })
      .eq("horario_clase_id", horarioId)
      .eq("estado", "confirmada");
    if (actual.horario?.estado !== "disponible" || (count ?? 0) > 0) {
      return { error: "Ese horario ya lo tomó otro alumno. Avísale a Gabriel para ajustarlo." };
    }
  }

  const { error: errorReserva } = await supabase
    .from("reservas")
    .update({ estado: resultado })
    .eq("id", reservaId);

  if (errorReserva) {
    return { error: errorReserva.message };
  }

  // Si el que no pudo ir fue el profesor, no es falta del alumno: el
  // horario queda disponible de nuevo en vez de "completado" (ver fix-17).
  const estadoHorario = resultado === "profesor_no_asistio" ? "disponible" : "completado";

  const { error: errorHorario } = await supabase
    .from("horarios_clase")
    .update({ estado: estadoHorario })
    .eq("id", horarioId);

  if (errorHorario) {
    return { error: errorHorario.message };
  }

  revalidatePath("/profesor");
  return { error: null };
}
