import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about UnstuckLabs apps, pricing, and how they work.",
};

const faqs = [
  {
    question: "How is this different from just using a to-do app?",
    answer:
      "Most to-do apps assume you already know how to break a task down and just need somewhere to write it. UnstuckLabs tools are built for the moment before that — when a task is too big or vague to even start.",
  },
  {
    question: "Do I have to buy every app to use one of them?",
    answer:
      "No. Every UnstuckLabs tool is priced and sold on its own. You only pay for the one you actually need — there's no bundle or forced upgrade.",
  },
  {
    question: "Is this a subscription or a one-time purchase?",
    answer:
      "It depends on the app — some are a small one-time purchase, others are a low monthly subscription. The price on each app's page always shows which.",
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
  },
  {
    question: "Can I suggest a tool that doesn't exist yet?",
    answer:
      "Yes — that's exactly what the \"help shape what we build next\" section on the homepage is for. Tell us what you're stuck on and we'll follow up.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
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
