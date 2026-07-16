import type { Metadata } from "next";

// Statically prerendering this page bakes in a stale CSP nonce that
// 'strict-dynamic' rejects at request time, silently blocking every script
// on the page. See middleware.ts and docs/ROADMAP.md's CSP notes.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shipping Policy",
  alternates: { canonical: "/legal/shipping-policy" },
};

export default function ShippingPolicyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold text-foreground">Shipping Policy</h1>
      <p className="mt-2 text-sm text-foreground/50">Last updated: July 2026</p>

      <div className="prose prose-neutral mt-8 max-w-none prose-headings:font-bold prose-a:text-primary">
        <p>
          UnstuckLabs sells digital products only — there is no physical shipping. Access to an App is
          granted automatically as soon as your payment is confirmed:
        </p>
        <ul>
          <li>You&apos;ll see the App listed under &quot;My subscriptions&quot; in your account immediately.</li>
          <li>You&apos;ll also receive a confirmation email with a direct link to launch it.</li>
          <li>
            Each App runs at its own web address and works instantly in your browser — nothing to download
            or install.
          </li>
        </ul>
        <p>
          If a payment succeeds but access doesn&apos;t appear within a few minutes,{" "}
          <a href="/contact">contact us</a> and we&apos;ll sort it out.
        </p>
      </div>
    </div>
  );
}
