// Tarea programada de Netlify: una vez al dia llama a /api/health, que hace
// una consulta minima a Supabase. Asi el proyecto gratuito nunca llega a los
// 7 dias sin actividad (el limite en que Supabase lo pausa).
export default async function handler() {
  const base = process.env.URL || "https://app.escuelagrandprix.com";
  const res = await fetch(`${base}/api/health`);
  if (!res.ok) {
    // Queda registrado como error en los logs de la funcion en Netlify.
    throw new Error(`Chequeo de salud fallo: HTTP ${res.status}`);
  }
  return new Response("ok");
}

export const config = {
  schedule: "0 15 * * *", // todos los dias, 10:00 a.m. hora de Lima
};
