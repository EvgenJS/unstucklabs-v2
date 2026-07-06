import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { ContactForm } from "../../components/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with UnstuckLabs by email or the form below.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold text-foreground">Contact us</h1>
      <p className="mt-2 text-foreground/70">
        Questions, bug reports, or anything else — reach out by email or the form below.
      </p>

      <a
        href="mailto:hello@unstucklabs.com"
        className="mt-8 flex w-fit items-center gap-2 font-semibold text-primary hover:text-primary/80"
      >
        <Mail className="h-5 w-5" aria-hidden="true" />
        hello@unstucklabs.com
      </a>

      <div className="mt-10">
        <ContactForm />
      </div>
    </div>
  );
}
