"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ResetPinState = { error: string | null; ok: boolean };

export async function resetearPin(
  alumnoId: string,
  _prevState: ResetPinState,
  formData: FormData,
): Promise<ResetPinState> {
  await requireProfile("admin");

  const pin = String(formData.get("pin") ?? "");
  if (!/^\d{6}$/.test(pin)) {
    return { error: "El PIN debe tener exactamente 6 dígitos.", ok: false };
  }

  const supabase = createAdminClient();
  const { error } = await supabase.auth.admin.updateUserById(alumnoId, { password: pin });

  if (error) {
    return { error: error.message, ok: false };
  }

  revalidatePath("/admin/alumnos");
  return { error: null, ok: true };
}

export type LiberarNoShowState = { error: string | null; ok: boolean };

// Una inasistencia consume la clase del paquete por defecto (el profesor y
// el carro ya se usaron igual) -- ver fix-13. Esto es la valvula de escape:
// si el admin decide que la falta estuvo justificada, la reclasifica como
// "cancelada" (no cuenta contra el limite) para liberarle el cupo de nuevo.
export async function liberarNoShow(
  reservaId: string,
  _prevState: LiberarNoShowState,
  _formData: FormData,
): Promise<LiberarNoShowState> {
  await requireProfile("admin");

  const supabase = await createClient();
  const { error } = await supabase
    .from("reservas")
    .update({ estado: "cancelada" })
    .eq("id", reservaId)
    .eq("estado", "no_show");

  if (error) {
    return { error: error.message, ok: false };
  }

  revalidatePath("/admin/alumnos");
  return { error: null, ok: true };
}
