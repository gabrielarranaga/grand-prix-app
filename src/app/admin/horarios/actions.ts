"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type BloqueoFormState = { error: string | null };

// El cronograma es fijo y se repite siempre; esto es solo para cerrar una
// franja puntual (vacaciones, dia que no atienden).
export async function bloquearFranja(
  fecha: string,
  horaInicio: string,
  horaFin: string,
  _prevState: BloqueoFormState,
  _formData: FormData,
): Promise<BloqueoFormState> {
  await requireProfile("admin");

  const supabase = await createClient();
  const { error } = await supabase.rpc("bloquear_horario", {
    p_fecha: fecha,
    p_hora_inicio: horaInicio,
    p_hora_fin: horaFin,
  });

  if (error) {
    return { error: error.message.replace(/^.*: /, "") };
  }

  revalidatePath("/admin/horarios");
  revalidatePath("/alumno/horarios");
  return { error: null };
}

// Asigna un cupo disponible directo a un alumno (sin que el alumno tenga
// que reservarlo el mismo desde la app).
export async function asignarClaseAlumno(
  fecha: string,
  horaInicio: string,
  horaFin: string,
  _prevState: BloqueoFormState,
  formData: FormData,
): Promise<BloqueoFormState> {
  await requireProfile("admin");

  const alumnoId = String(formData.get("alumno_id") ?? "");
  if (!alumnoId) {
    return { error: "Selecciona un alumno." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("asignar_clase_a_alumno", {
    p_fecha: fecha,
    p_hora_inicio: horaInicio,
    p_hora_fin: horaFin,
    p_alumno_id: alumnoId,
  });

  if (error) {
    return { error: error.message.replace(/^.*: /, "") };
  }

  revalidatePath("/admin/horarios");
  revalidatePath("/alumno/horarios");
  revalidatePath("/alumno/agenda");
  return { error: null };
}

// Reabre una franja que el admin habia bloqueado (borra la fila: sin fila
// = disponible de nuevo, por default).
export async function desbloquearFranja(formData: FormData) {
  await requireProfile("admin");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("horarios_clase").delete().eq("id", id).eq("estado", "bloqueado");

  revalidatePath("/admin/horarios");
  revalidatePath("/alumno/horarios");
}

// Le anota a una clase ya reservada que profesor la va a dictar, para que a
// ese profesor le salga en su propio cronograma. Vacio = sin asignar.
export async function asignarProfesorHorario(formData: FormData) {
  await requireProfile("admin");

  const id = String(formData.get("id") ?? "");
  const profesorId = String(formData.get("profesor_id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("horarios_clase")
    .update({ profesor_id: profesorId || null })
    .eq("id", id)
    .eq("estado", "reservado");

  revalidatePath("/admin/horarios");
  revalidatePath("/profesor");
}
