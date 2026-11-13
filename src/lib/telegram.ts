import { after } from "next/server";

// Avisos al Telegram del dueño (pago por revisar, reserva, cancelacion,
// alumno nuevo). Si faltan las variables de entorno no hace nada, asi la app
// funciona igual sin el bot:
//   TELEGRAM_BOT_TOKEN   token que da @BotFather
//   TELEGRAM_CHAT_IDS    ids de chat separados por coma (el del papa y el tuyo)
export function avisarTelegram(texto: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chats = (process.env.TELEGRAM_CHAT_IDS ?? "").split(",").map((c) => c.trim()).filter(Boolean);
  if (!token || chats.length === 0) return;

  // after(): se envia cuando ya se respondio al alumno, sin hacerlo esperar.
  after(async () => {
    await Promise.all(
      chats.map((chat_id) =>
        fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id, text: texto }),
        }).catch(() => undefined),
      ),
    );
  });
}
