"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ConfiguracionFormState = { error: string | null; guardado?: boolean };

export async function guardarConfiguracion(
  _prevState: ConfiguracionFormState,
  formData: FormData,
): Promise<ConfiguracionFormState> {
  await requireProfile("admin");

  const puntoEncuentroTexto = String(formData.get("punto_encuentro_texto") ?? "").trim();
  const puntoEncuentroMapsLink = String(formData.get("punto_encuentro_maps_link") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase
    .from("configuracion_negocio")
    .update({
      punto_encuentro_texto: puntoEncuentroTexto || null,
      punto_encuentro_maps_link: puntoEncuentroMapsLink || null,
    })
    .eq("id", true);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/configuracion");
  return { error: null, guardado: true };
}
