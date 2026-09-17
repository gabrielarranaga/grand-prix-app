"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type CompraFormState = { error: string | null };

const NUMERO_WHATSAPP = "51990697634";

const ETIQUETA_METODO: Record<string, string> = {
  yape: "Yape",
  plin: "Plin",
  tarjeta: "Tarjeta",
  efectivo: "Efectivo en la oficina",
};

const ETIQUETA_MODALIDAD: Record<string, string> = {
  contado: "al contado",
  medio_medio: "50% ahora y 50% a mitad del curso",
};

export async function elegirPaquete(
  paqueteId: string,
  _prevState: CompraFormState,
  formData: FormData,
): Promise<CompraFormState> {
  const profile = await requireProfile("alumno");

  const metodoPago = String(formData.get("metodo_pago") ?? "");
  if (!metodoPago) {
    return { error: "Selecciona un método de pago." };
  }

  const modalidadPago = String(formData.get("modalidad_pago") ?? "");
  if (!modalidadPago) {
    return { error: "Selecciona si pagas al contado o en dos partes." };
  }

  const supabase = await createClient();

  const { count: comprasActivas } = await supabase
    .from("compras_paquete")
    .select("id", { count: "exact", head: true })
    .eq("alumno_id", profile.id)
    .neq("estado", "cancelado");

  if ((comprasActivas ?? 0) > 0) {
    return {
      error:
        "Ya tienes un paquete activo. Solo se puede tener uno a la vez — escríbenos por WhatsApp si quieres cambiarlo.",
    };
  }

  const { data: paquete } = await supabase
    .from("paquetes")
    .select("nombre, precio")
    .eq("id", paqueteId)
    .single();

  if (!paquete) {
    return { error: "Ese paquete ya no está disponible." };
  }

  const { error } = await supabase.from("compras_paquete").insert({
    alumno_id: profile.id,
    paquete_id: paqueteId,
    precio: paquete.precio,
    metodo_pago: metodoPago,
    modalidad_pago: modalidadPago,
    estado: "pendiente",
  });

  if (error) {
    if (error.code === "23505") {
      return {
        error:
          "Ya tienes un paquete activo. Solo se puede tener uno a la vez — escríbenos por WhatsApp si quieres cambiarlo.",
      };
    }
    return { error: error.message };
  }

  const etiquetaMetodo = ETIQUETA_METODO[metodoPago] ?? metodoPago;
  const etiquetaModalidad = ETIQUETA_MODALIDAD[modalidadPago] ?? modalidadPago;
  const mensaje = encodeURIComponent(
    `Hola, soy ${profile.nombre}. Quiero el paquete ${paquete.nombre}: S/ ${paquete.precio.toFixed(2)}, pagando ${etiquetaModalidad} por ${etiquetaMetodo}. ¿Cómo continuamos?`,
  );

  redirect(`https://wa.me/${NUMERO_WHATSAPP}?text=${mensaje}`);
}

export type CancelarCompraState = { error: string | null };

// Solo se puede cancelar mientras siga 'pendiente' (todavia no coordino
// pago). Una vez parcial/pagada, un cambio de paquete pasa por WhatsApp.
export async function cancelarMiCompra(
  compraId: string,
  _prevState: CancelarCompraState,
  _formData: FormData,
): Promise<CancelarCompraState> {
  const profile = await requireProfile("alumno");

  const supabase = await createClient();
  const { error } = await supabase
    .from("compras_paquete")
    .update({ estado: "cancelado" })
    .eq("id", compraId)
    .eq("alumno_id", profile.id)
    .eq("estado", "pendiente");

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/alumno/paquetes");
  return { error: null };
}
