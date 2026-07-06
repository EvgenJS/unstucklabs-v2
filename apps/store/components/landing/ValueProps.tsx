import { Wallet, HeartHandshake, Zap } from "lucide-react";
import { Card } from "@unstucklabs/ui";

const props = [
  {
    icon: Wallet,
    title: "Pay only for what you need",
    description:
      "Every tool is sold on its own — no bundle, no forced upgrade. Pick the one thing that solves your problem.",
  },
  {
    icon: HeartHandshake,
    title: "Made by someone who's been there",
    description:
      "UnstuckLabs isn't a faceless company. It's built by someone who's struggled with the exact same task paralysis.",
  },
  {
    icon: Zap,
    title: "Start instantly, no installs",
    description:
      "Every app is a PWA — open a link and it just works, on any device, with no app store in the way.",
  },
];

export function ValueProps() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <h2 className="text-center text-2xl font-bold text-foreground">Why UnstuckLabs</h2>
      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {props.map(({ icon: Icon, title, description }) => (
          <Card key={title}>
            <Icon className="h-8 w-8 text-primary" aria-hidden="true" />
            <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
            <p className="mt-2 text-sm text-foreground/70">{description}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
