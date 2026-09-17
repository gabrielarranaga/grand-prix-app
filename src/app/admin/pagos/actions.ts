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
