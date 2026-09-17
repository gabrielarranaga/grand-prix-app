"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ReservaFormState = { error: string | null };

export async function cancelarReserva(
  reservaId: string,
  _prevState: ReservaFormState,
  _formData: FormData,
): Promise<ReservaFormState> {
  await requireProfile("alumno");

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancelar_reserva", { p_reserva_id: reservaId });

  if (error) {
    return { error: error.message.replace(/^.*: /, "") };
  }

  revalidatePath("/alumno/agenda");
  return { error: null };
}
