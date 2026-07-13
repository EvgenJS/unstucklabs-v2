import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy",
};

export default function RefundPolicyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold text-foreground">Refund Policy</h1>
      <p className="mt-2 text-sm text-foreground/50">Last updated: July 2026</p>

      <div className="prose prose-neutral mt-8 max-w-none prose-headings:font-bold prose-a:text-primary">
        <h2>One-time purchases</h2>
        <p>
          If an App doesn&apos;t work for you, contact us within 14 days of purchase and we&apos;ll refund it in
          full — no need to explain why.
        </p>

        <h2>Subscriptions</h2>
        <p>
          You can cancel a subscription at any time; you&apos;ll keep access until the end of the period you
          already paid for, and you won&apos;t be charged again. We don&apos;t provide partial refunds for time
          already used within a billing period, except where required by law.
        </p>

        <h2>How to request a refund</h2>
        <p>
          Email <a href="mailto:hello@unstucklabs.store">hello@unstucklabs.store</a> or use the{" "}
          <a href="/contact">contact form</a> with the email address you purchased under. Refunds are
          processed back to your original payment method.
        </p>
      </div>
    </div>
  );
}
