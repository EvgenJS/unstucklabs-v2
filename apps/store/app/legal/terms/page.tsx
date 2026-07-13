import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
      <p className="mt-2 text-sm text-foreground/50">Last updated: July 2026</p>

      <div className="prose prose-neutral mt-8 max-w-none prose-headings:font-bold prose-a:text-primary">
        <h2>1. Who operates this site</h2>
        <p>
          UnstuckLabs (&quot;we&quot;, &quot;us&quot;) is operated by an individual based in Ukraine. UnstuckLabs
          is not currently a registered legal entity — you are contracting with an individual operator.
        </p>

        <h2>2. What we offer</h2>
        <p>
          UnstuckLabs sells access to a set of independently-priced digital tools (each, an &quot;App&quot;).
          Each App is billed separately, either as a one-time purchase or a recurring subscription, as shown
          on that App&apos;s pricing page. Buying or subscribing to one App does not grant access to any other App.
        </p>

        <h2>3. Accounts</h2>
        <p>
          You need an account to purchase or use an App. You&apos;re responsible for keeping your login
          credentials secure and for all activity under your account.
        </p>

        <h2>4. Billing and subscriptions</h2>
        <p>
          Payments are processed by a third-party payment provider. Subscriptions renew automatically at the
          interval shown at checkout until cancelled. You can cancel at any time from your account; access
          continues until the end of the paid period.
        </p>

        <h2>5. Acceptable use</h2>
        <p>
          Don&apos;t use UnstuckLabs Apps for anything illegal, to abuse or attack our systems, or to resell or
          redistribute access without permission.
        </p>

        <h2>6. Disclaimer</h2>
        <p>
          UnstuckLabs Apps are productivity and wellness tools. They are not medical devices and are not a
          substitute for professional medical, psychological, or financial advice.
        </p>

        <h2>7. Limitation of liability</h2>
        <p>
          Apps are provided &quot;as is&quot;, without warranties of any kind. To the maximum extent permitted by
          law, we are not liable for indirect or consequential damages arising from your use of an App.
        </p>

        <h2>8. Changes to these terms</h2>
        <p>We may update these terms as UnstuckLabs grows. Continued use after a change means you accept the update.</p>

        <h2>9. Contact</h2>
        <p>
          Questions about these terms — <a href="/contact">contact us</a> or email{" "}
          <a href="mailto:hello@unstucklabs.store">hello@unstucklabs.store</a>.
        </p>
      </div>
    </div>
  );
}
