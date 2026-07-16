import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { ContactForm } from "../../components/ContactForm";

// Statically prerendering this page bakes in a stale CSP nonce that
// 'strict-dynamic' rejects at request time, silently blocking every script
// on the page -- including ContactForm's own hydration, which is why the
// form previously fell back to a plain browser GET submission instead of
// calling handleSubmit. See middleware.ts and docs/ROADMAP.md's CSP notes.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with UnstuckLabs by email or the form below.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold text-foreground">Contact us</h1>
      <p className="mt-2 text-foreground/70">
        Questions, bug reports, or anything else — reach out by email or the form below.
      </p>

      <a
        href="mailto:hello@unstucklabs.store"
        className="mt-8 flex w-fit items-center gap-2 font-semibold text-primary hover:text-primary/80"
      >
        <Mail className="h-5 w-5" aria-hidden="true" />
        hello@unstucklabs.store
      </a>

      <div className="mt-10">
        <ContactForm />
      </div>
    </div>
  );
}
