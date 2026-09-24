"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type FinanzasFormState = { error: string | null; ok?: boolean };

const TIPOS = ["ingreso", "egreso"] as const;

type MovimientoLeido =
  | { error: string }
  | {
      datos: {
        tipo: string;
        categoria_id: string;
        monto: number;
        fecha: string;
        notas: string | null;
      };
    };

function leerMovimiento(formData: FormData): MovimientoLeido {
  const tipo = String(formData.get("tipo") ?? "");
  const categoriaId = String(formData.get("categoria_id") ?? "");
  const monto = Number(String(formData.get("monto") ?? "").replace(",", "."));
  const fecha = String(formData.get("fecha") ?? "");
  const notas = String(formData.get("notas") ?? "").trim();

  if (!TIPOS.includes(tipo as (typeof TIPOS)[number])) {
    return { error: "Elige si es ingreso o egreso." };
  }
  if (!categoriaId) {
    return { error: "Elige una categoría." };
  }
  if (!Number.isFinite(monto) || monto <= 0) {
    return { error: "El monto tiene que ser mayor a 0." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return { error: "Elige una fecha." };
  }

  return {
    datos: {
      tipo,
      categoria_id: categoriaId,
      monto: Math.round(monto * 100) / 100,
      fecha,
      notas: notas || null,
    },
  };
}

export async function crearMovimiento(
  _prev: FinanzasFormState,
  formData: FormData,
): Promise<FinanzasFormState> {
  await requireProfile("admin");

  const leido = leerMovimiento(formData);
  if ("error" in leido) return { error: leido.error };

  const supabase = await createClient();
  const { error } = await supabase.from("movimientos_financieros").insert(leido.datos);
  if (error) return { error: "No se pudo guardar. Revisa los datos e intenta de nuevo." };

  revalidatePath("/admin/finanzas");
  return { error: null, ok: true };
}

export async function editarMovimiento(
  movimientoId: string,
  _prev: FinanzasFormState,
  formData: FormData,
): Promise<FinanzasFormState> {
  await requireProfile("admin");

  const leido = leerMovimiento(formData);
  if ("error" in leido) return { error: leido.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("movimientos_financieros")
    .update(leido.datos)
    .eq("id", movimientoId);
  if (error) return { error: "No se pudo guardar. Revisa los datos e intenta de nuevo." };

  revalidatePath("/admin/finanzas");
  return { error: null, ok: true };
}

export async function borrarMovimiento(movimientoId: string) {
  await requireProfile("admin");

  const supabase = await createClient();
  await supabase.from("movimientos_financieros").delete().eq("id", movimientoId);

  revalidatePath("/admin/finanzas");
}

export async function crearCategoria(
  _prev: FinanzasFormState,
  formData: FormData,
): Promise<FinanzasFormState> {
  await requireProfile("admin");

  const nombre = String(formData.get("nombre") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "");
  if (!nombre) return { error: "Escribe un nombre." };
  if (!TIPOS.includes(tipo as (typeof TIPOS)[number])) return { error: "Elige ingreso o egreso." };

  const supabase = await createClient();
  const { error } = await supabase.from("categorias_financieras").insert({ nombre, tipo });
  if (error) {
    return {
      error: error.code === "23505" ? "Ya existe una categoría con ese nombre." : "No se pudo guardar.",
    };
  }

  revalidatePath("/admin/finanzas", "layout");
  return { error: null, ok: true };
}

export async function renombrarCategoria(
  categoriaId: string,
  _prev: FinanzasFormState,
  formData: FormData,
): Promise<FinanzasFormState> {
  await requireProfile("admin");

  const nombre = String(formData.get("nombre") ?? "").trim();
  if (!nombre) return { error: "Escribe un nombre." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("categorias_financieras")
    .update({ nombre })
    .eq("id", categoriaId);
  if (error) {
    return {
      error: error.code === "23505" ? "Ya existe una categoría con ese nombre." : "No se pudo guardar.",
    };
  }

  revalidatePath("/admin/finanzas", "layout");
  return { error: null, ok: true };
}

// Archivar en vez de borrar: los movimientos viejos siguen apuntando a la
// categoria y los totales historicos no cambian; solo deja de aparecer en
// el formulario de carga.
export async function cambiarEstadoCategoria(categoriaId: string, activa: boolean) {
  await requireProfile("admin");

  const supabase = await createClient();
  await supabase.from("categorias_financieras").update({ activa }).eq("id", categoriaId);

  revalidatePath("/admin/finanzas", "layout");
}
