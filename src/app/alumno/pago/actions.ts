"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function registrarComprobante(
  compraId: string,
  archivoPath: string,
): Promise<{ error: string | null }> {
  await requireProfile("alumno");

  const supabase = await createClient();
  const { error } = await supabase.rpc("registrar_comprobante", {
    p_compra_id: compraId,
    p_archivo_path: archivoPath,
  });

  if (error) {
    return { error: error.message.replace(/^.*: /, "") };
  }

  revalidatePath("/alumno/pago");
  revalidatePath("/admin/pagos");
  return { error: null };
}
