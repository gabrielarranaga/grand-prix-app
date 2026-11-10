import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Chequeo de salud: hace una consulta minima a la base. Lo llama todos los
// dias la tarea programada de Netlify (netlify/functions/keepalive.mjs) para
// que el plan gratuito de Supabase NO pause el proyecto por inactividad
// (se pausa tras 7 dias sin uso y, mientras esta pausado, nadie puede entrar).
// No devuelve datos, solo si la base respondio.
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createAdminClient();
  const { error } = await supabase.from("configuracion_negocio").select("id").limit(1);

  if (error) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
