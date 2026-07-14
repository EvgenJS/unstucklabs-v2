import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about UnstuckLabs apps, pricing, and how they work.",
  alternates: { canonical: "/faq" },
};

interface Faq {
  question: string;
  answer: ReactNode;
  // Plain-text version for FAQPage JSON-LD, only needed when `answer` isn't already a string.
  schemaAnswer?: string;
}

const faqs: Faq[] = [
  {
    question: "How is this different from just using a to-do app?",
    answer:
      "Most to-do apps assume you already know how to break a task down and just need somewhere to write it. UnstuckLabs tools are built for the moment before that — when a task is too big or vague to even start.",
  },
  {
    // DRAFT: expanded per an SEO/GEO agent's citability pass -- review/edit
    // before this ships, this is a suggestion, not a copy decision.
    question: "Do I have to buy every app to use one of them?",
    answer:
      "No. Every UnstuckLabs tool — Unstuck Daily, HabitFlow, FishCast, and anything we build after — is priced and sold on its own. You only pay for the one you actually need, and buying one doesn't require or discount any of the others — there's no bundle or forced upgrade.",
  },
  {
    // DRAFT: expanded per an SEO/GEO agent's citability pass -- review/edit
    // before this ships. No specific price named on purpose -- current
    // pricing is provisional and will change, don't reintroduce a number
    // here without checking with the user first.
    question: "Is this a subscription or a one-time purchase?",
    answer:
      "It depends on the app — some are a small one-time purchase, others are a low monthly subscription with a cheaper annual option. The price on each app's page always shows which, and that's not a fixed rule going forward — whichever model fits the tool best.",
  },
  {
    question: "Do I need to install anything?",
    answer:
      "No. Every app is a PWA (progressive web app) — open the link and it works immediately in your browser. You can optionally install it to your home screen for quicker access, but it's never required.",
  },
  {
    question: "What if it doesn't work for me?",
    answer: (
      <>
        See our{" "}
        <Link href="/legal/refund-policy" className="font-semibold text-primary hover:text-primary/80">
          Refund Policy
        </Link>{" "}
        for details on cancellations and refunds.
      </>
    ),
    schemaAnswer: "See our Refund Policy page for details on cancellations and refunds.",
  },
  {
    question: "Can I suggest a tool that doesn't exist yet?",
    answer:
      "Yes — that's exactly what the \"help shape what we build next\" section on the homepage is for. Tell us what you're stuck on and we'll follow up.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: typeof faq.answer === "string" ? faq.answer : (faq.schemaAnswer ?? ""),
    },
  })),
};

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <h1 className="text-3xl font-bold text-foreground">Frequently asked questions</h1>
      <div className="mt-10 space-y-8">
        {faqs.map((faq) => (
          <div key={faq.question}>
            <h2 className="font-semibold text-foreground">{faq.question}</h2>
            <p className="mt-2 text-foreground/70">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
