"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Rol } from "@/lib/types";

export type AuthState = { error: string | null };

async function rutaPorRol(rol: Rol | undefined) {
  if (rol === "admin") return "/admin";
  if (rol === "profesor") return "/profesor";
  return "/alumno";
}

// El login real sigue siendo email+password de Supabase Auth -- el telefono
// nunca se verifica por SMS (eso cuesta dinero). El truco: el telefono hace
// de "email" internamente, sin que el alumno lo vea nunca. Admin/profesores
// (creados a mano, no por este formulario) siguen entrando con su email real
// -- por eso el login detecta si lo que escribieron tiene "@".
function sanitizarTelefono(telefono: string) {
  let digitos = telefono.replace(/\D/g, "");
  if (digitos.length === 11 && digitos.startsWith("51")) {
    digitos = digitos.slice(2);
  }
  return digitos;
}

function emailInternoDesdeTelefono(telefonoSanitizado: string) {
  return `tel${telefonoSanitizado}@grandprix.local`;
}

export async function registrarAlumno(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const apellido = String(formData.get("apellido") ?? "").trim();
  const telefono = sanitizarTelefono(String(formData.get("telefono") ?? ""));
  const pin = String(formData.get("pin") ?? "");

  if (!nombre || !apellido) {
    return { error: "Completa tu nombre y apellido." };
  }
  if (telefono.length !== 9) {
    return { error: "Ingresa un número de celular válido (9 dígitos)." };
  }
  if (!/^\d{6}$/.test(pin)) {
    return { error: "El PIN debe tener exactamente 6 dígitos." };
  }

  const nombreCompleto = `${nombre} ${apellido}`;
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: emailInternoDesdeTelefono(telefono),
    password: pin,
    options: { data: { nombre: nombreCompleto, telefono, rol: "alumno" } },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { error: "Ese número de celular ya tiene una cuenta. Inicia sesión en vez de registrarte." };
    }
    return { error: error.message };
  }

  redirect("/alumno");
}

export async function iniciarSesion(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const identificador = String(formData.get("identificador") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  // Admin/profesores (cuenta creada a mano) entran con su email real.
  // Alumnos entran con su celular -- se traduce al mismo email interno que
  // se genero al registrarse.
  const email = identificador.includes("@")
    ? identificador
    : emailInternoDesdeTelefono(sanitizarTelefono(identificador));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Celular/correo o contraseña incorrectos." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("rol")
    .eq("id", data.user.id)
    .single();

  redirect(await rutaPorRol(profile?.rol));
}

export async function cerrarSesion() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
