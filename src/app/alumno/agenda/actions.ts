"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { avisarTelegram } from "@/lib/telegram";
import { hora12 } from "@/lib/horarios";

export type ReservaFormState = { error: string | null };

export async function cancelarReserva(
  reservaId: string,
  _prevState: ReservaFormState,
  _formData: FormData,
): Promise<ReservaFormState> {
  const profile = await requireProfile("alumno");

  const supabase = await createClient();
  const { data: previa } = await supabase
    .from("reservas")
    .select("horario:horarios_clase(fecha, hora_inicio)")
    .eq("id", reservaId)
    .maybeSingle<{ horario: { fecha: string; hora_inicio: string } | null }>();
  const { error } = await supabase.rpc("cancelar_reserva", { p_reserva_id: reservaId });

  if (error) {
    return { error: error.message.replace(/^.*: /, "") };
  }

  avisarTelegram(
    `❌ ${profile.nombre} canceló su clase${
      previa?.horario ? ` del ${previa.horario.fecha} a las ${hora12(previa.horario.hora_inicio.slice(0, 5))}` : ""
    }. El cupo quedó libre.`,
  );
  revalidatePath("/alumno/agenda");
  return { error: null };
}
