import { Resend } from "resend";

// Thin wrapper so the rest of the app never imports the `resend` package
// directly. Without RESEND_API_KEY set (e.g. local dev before the account
// exists), sends are logged and skipped rather than throwing -- waitlist
// capture must keep working even if email sending isn't configured yet.
// Resend's verified sending domain for this account is unstucklabs.store,
// not unstucklabs.com (the app's own domain) -- same domain v1 already used
// for transactional email. Configurable in case that ever changes without
// needing a code deploy.
const EMAIL_FROM = process.env.EMAIL_FROM ?? "UnstuckLabs <hello@unstucklabs.store>";

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
      const { error } = await client.emails.send({
        from: EMAIL_FROM,
        to,
        subject,
        html,
      });
      // The Resend SDK never throws on API-level failures (bad domain,
      // rate limit, etc.) -- it resolves with { error } instead, so this
      // check is the only thing standing between a broken send and a
      // silent no-op that looks identical to success from the caller's
      // side (e.g. register() still returning 201).
      if (error) {
        throw new Error(`[email] Resend send to ${to} failed: ${error.message}`);
      }
    },
  };
}
