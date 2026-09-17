"use server";

import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Herramienta de pruebas: entra a cualquier cuenta con un click, sin PIN ni
// contraseña, para poder probar los 3 roles rapido. No existe en produccion
// (ver el mismo chequeo en page.tsx).
export async function entrarComo(userId: string) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const admin = createAdminClient();
  const { data: authUser, error: errUser } = await admin.auth.admin.getUserById(userId);
  if (errUser || !authUser.user?.email) {
    throw new Error("No se pudo ubicar esa cuenta.");
  }

  const { data: linkData, error: errLink } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: authUser.user.email,
  });
  if (errLink || !linkData) {
    throw new Error(errLink?.message ?? "No se pudo generar el acceso.");
  }

  const supabase = await createClient();
  const { error: errVerify } = await supabase.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: "magiclink",
  });
  if (errVerify) {
    throw new Error(errVerify.message);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", userId)
    .single();

  redirect(profile?.rol ? `/${profile.rol}` : "/login");
}
