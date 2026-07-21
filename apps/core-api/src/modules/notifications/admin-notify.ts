import { createEmailService } from "../email/email.service.js";
import { renderEmailHtml } from "../email/email-template.js";
import { createTelegramService } from "./telegram.service.js";

// Same inbox used for contact-form notifications -- CONTACT_NOTIFY_EMAIL's
// default (hello@unstucklabs.store) turned out to have no real receiving
// mailbox behind it, so this is deliberately shared, not a second env var.
const ADMIN_NOTIFY_EMAIL = process.env.CONTACT_NOTIFY_EMAIL ?? "hello@unstucklabs.store";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Fires an admin alert over every configured channel in parallel, best
// effort -- a failure on one channel (or both) must never block the caller,
// since whatever triggered the alert (a new request, a renewal coming due)
// has already happened and is durably stored regardless. Two channels
// because a single missed email is exactly how the original contact-form
// gap went unnoticed for so long -- see docs/ROADMAP.md.
export async function notifyAdmin(subject: string, text: string) {
  const emailService = createEmailService();
  const telegramService = createTelegramService();

  const results = await Promise.allSettled([
    emailService.sendTransactional(
      ADMIN_NOTIFY_EMAIL,
      subject,
      renderEmailHtml({
        heading: subject,
        bodyHtml: `<p style="margin: 0; white-space: pre-wrap;">${escapeHtml(text)}</p>`,
      }),
    ),
    telegramService.sendMessage(`${subject}\n\n${text}`),
  ]);

  return results;
}
