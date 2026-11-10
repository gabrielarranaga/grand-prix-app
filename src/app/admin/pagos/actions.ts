"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { EstadoCompra } from "@/lib/types";

export async function marcarPago(compraId: string, estado: EstadoCompra) {
  await requireProfile("admin");

  const supabase = await createClient();
  await supabase.from("compras_paquete").update({ estado }).eq("id", compraId);

  revalidatePath("/admin/pagos");
}

// Aprobar marca la compra como 50% o pagada (lo decide la base segun el
// tramo del comprobante) y eso registra el ingreso en finanzas solo.
export async function revisarComprobante(comprobanteId: string, aprobar: boolean) {
  await requireProfile("admin");

  const supabase = await createClient();
  await supabase.rpc("revisar_comprobante", {
    p_comprobante_id: comprobanteId,
    p_aprobar: aprobar,
  });

  revalidatePath("/admin/pagos");
  revalidatePath("/admin");
  revalidatePath("/admin/finanzas");
}
