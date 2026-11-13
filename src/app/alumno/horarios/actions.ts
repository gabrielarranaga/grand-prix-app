"use server";

import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { avisarTelegram } from "@/lib/telegram";
import { hora12 } from "@/lib/horarios";

export type ReservaFormState = { error: string | null };

export async function reservarClase(
  fecha: string,
  horaInicio: string,
  horaFin: string,
  _prevState: ReservaFormState,
  _formData: FormData,
): Promise<ReservaFormState> {
  const profile = await requireProfile("alumno");

  const supabase = await createClient();
  const { error } = await supabase.rpc("reservar_clase_en_fecha", {
    p_fecha: fecha,
    p_hora_inicio: horaInicio,
    p_hora_fin: horaFin,
  });

  if (error) {
    return { error: error.message.replace(/^.*: /, "") };
  }

  avisarTelegram(`📅 ${profile.nombre} reservó una clase el ${fecha} a las ${hora12(horaInicio)}.`);
  redirect(`/alumno/horarios?reservado=1&dia=${fecha}`);
}
