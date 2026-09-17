import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Rol } from "@/lib/types";

// El middleware ya protege las rutas por rol; esto es una segunda
// verificacion a nivel de Server Component por si se renderiza directo.
export async function requireProfile(rolEsperado: Rol): Promise<Profile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile || profile.rol !== rolEsperado) {
    redirect(profile?.rol ? `/${profile.rol}` : "/login");
  }

  return profile;
}
