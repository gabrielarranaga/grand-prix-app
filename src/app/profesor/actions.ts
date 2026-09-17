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
