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
        // Printing the body (not just the subject) matters for local
        // testing of anything with a link in it -- e.g. email
        // verification, whose flow otherwise can't be exercised at all
        // without a real Resend key.
        console.warn(`[email] RESEND_API_KEY not set, skipping send to ${to}: ${subject}`);
        console.log(html);
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
