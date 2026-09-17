import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Corre cada 10-15 min (ver vercel.json). Busca reservas a 1h50-2h de
// empezar que todavia no mandaron recordatorio y dispara WhatsApp + correo
// AL MISMO TIEMPO, sin esperar a ver si uno "llego" -- rastrear entregas es
// mucho mas complejo y no vale la pena para el tamaño del negocio. Si falla
// un canal, casi seguro llega el otro.
//
// Variables de entorno necesarias (si faltan, ese canal simplemente no se
// envia -- no revienta el cron):
//   CRON_SECRET               protege este endpoint de llamadas externas
//   RESEND_API_KEY            correo (https://resend.com)
//   RESEND_FROM                ej: "Grand Prix <recordatorios@tudominio.pe>"
//   TWILIO_ACCOUNT_SID         WhatsApp via Twilio (alternativa no-oficial,
//   TWILIO_AUTH_TOKEN          mas simple que la API oficial de Meta: esa
//   TWILIO_WHATSAPP_FROM       exige plantillas pre-aprobadas para mensajes
//                              que la escuela inicia, ver nota en el chat)

type Recordatorio = {
  reserva_id: string;
  alumno_nombre: string;
  alumno_telefono: string | null;
  alumno_email: string | null;
  fecha: string;
  hora_inicio: string;
  instructor_nombre: string | null;
  punto_encuentro_texto: string | null;
  punto_encuentro_maps_link: string | null;
};

function formatearHora(hora: string) {
  const [hh, mm] = hora.split(":").map(Number);
  const periodo = hh >= 12 ? "p.m." : "a.m.";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return mm === 0 ? `${h12} ${periodo}` : `${h12}:${String(mm).padStart(2, "0")} ${periodo}`;
}

function construirMensaje(r: Recordatorio) {
  const lugar = r.punto_encuentro_texto ?? "el punto de encuentro de siempre";
  const link = r.punto_encuentro_maps_link ? ` (${r.punto_encuentro_maps_link})` : "";
  const instructor = r.instructor_nombre ?? "tu instructor de siempre";
  return (
    `Hola ${r.alumno_nombre.split(" ")[0]}, tu clase es en 2 horas (hoy ${formatearHora(r.hora_inicio)}) ` +
    `en ${lugar}${link}. Tu instructor: ${instructor}. Si necesitas cambiarla, hazlo en la app.`
  );
}

async function enviarCorreo(destino: string, asunto: string, texto: string) {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) return;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM,
      to: destino,
      subject: asunto,
      text: texto,
    }),
  });
}

async function enviarWhatsApp(telefono: string, texto: string) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_FROM) return;

  const numero = telefono.startsWith("+") ? telefono : `+51${telefono.replace(/\D/g, "")}`;

  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      From: TWILIO_WHATSAPP_FROM,
      To: `whatsapp:${numero}`,
      Body: texto,
    }),
  });
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  const supabase = createAdminClient();
  const { data: pendientes, error } = await supabase.rpc("recordatorios_pendientes");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const recordatorios = (pendientes ?? []) as Recordatorio[];
  let procesados = 0;

  for (const r of recordatorios) {
    const texto = construirMensaje(r);

    await Promise.allSettled([
      r.alumno_email ? enviarCorreo(r.alumno_email, "Tu clase es en 2 horas", texto) : null,
      r.alumno_telefono ? enviarWhatsApp(r.alumno_telefono, texto) : null,
    ]);

    await supabase.from("reservas").update({ recordatorio_enviado: true }).eq("id", r.reserva_id);
    procesados++;
  }

  return NextResponse.json({ procesados });
}
