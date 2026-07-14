import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: { canonical: "/legal/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold text-foreground">Privacy Policy</h1>
      <p className="mt-2 text-sm text-foreground/50">Last updated: July 2026</p>

      <div className="prose prose-neutral mt-8 max-w-none prose-headings:font-bold prose-a:text-primary">
        <h2>1. What we collect</h2>
        <ul>
          <li>Account data: your email address and a securely hashed password.</li>
          <li>
            Usage data: which Apps you&apos;ve subscribed to or purchased, and data you enter inside an App
            (used only to run that App for you).
          </li>
          <li>
            Messages you send us: anything submitted through the waitlist, contact, or app-suggestion forms.
          </li>
        </ul>

        <h2>2. How we use it</h2>
        <p>
          To create and secure your account, provide the Apps you&apos;ve purchased, respond to support
          requests, and — only if you&apos;ve opted in — send you product updates by email.
        </p>

        <h2>3. Cookies</h2>
        <p>
          We use a single essential cookie to keep you logged in across UnstuckLabs and its Apps. We don&apos;t
          use advertising or third-party tracking cookies.
        </p>

        <h2>4. Who we share data with</h2>
        <ul>
          <li>Our payment processor, to handle checkout and billing.</li>
          <li>Our email delivery provider, to send transactional emails and opt-in updates.</li>
        </ul>
        <p>We don&apos;t sell your data to anyone.</p>

        <h2>5. Your rights</h2>
        <p>
          You can ask us to access, correct, or delete your personal data at any time by{" "}
          <a href="/contact">contacting us</a>.
        </p>

        <h2>6. Contact</h2>
        <p>
          Questions about this policy — email <a href="mailto:hello@unstucklabs.store">hello@unstucklabs.store</a>.
        </p>
      </div>
    </div>
  );
}
