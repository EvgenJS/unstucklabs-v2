import { Resend } from "resend";

// Thin wrapper so the rest of the app never imports the `resend` package
// directly. Without RESEND_API_KEY set (e.g. local dev before the account
// exists), sends are logged and skipped rather than throwing -- waitlist
// capture must keep working even if email sending isn't configured yet.
export function createEmailService() {
  const apiKey = process.env.RESEND_API_KEY;
  const client = apiKey ? new Resend(apiKey) : undefined;

  return {
    async sendTransactional(to: string, subject: string, html: string) {
      if (!client) {
        console.warn(`[email] RESEND_API_KEY not set, skipping send to ${to}: ${subject}`);
        return;
      }
      await client.emails.send({
        from: "UnstuckLabs <hello@unstucklabs.com>",
        to,
        subject,
        html,
      });
    },
  };
}
