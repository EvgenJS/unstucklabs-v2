// Thin wrapper around the Telegram Bot API sendMessage call, mirroring
// email.service.ts's shape: without TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID set,
// sends are logged and skipped rather than throwing, so admin-notification
// call sites never have to special-case "Telegram isn't configured yet."
export function createTelegramService() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  return {
    async sendMessage(text: string) {
      if (!botToken || !chatId) {
        console.warn(`[telegram] TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID not set, skipping message: ${text}`);
        return;
      }
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`[telegram] sendMessage failed (${res.status}): ${body}`);
      }
    },
  };
}
