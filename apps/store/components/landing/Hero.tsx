import { Card } from "@unstucklabs/ui";
import { WaitlistForm } from "../WaitlistForm";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/hero-focus.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-foreground/90 via-foreground/85 to-foreground/75" />
      <div className="relative mx-auto max-w-3xl px-6 pt-20 pb-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Starting is the hard part. We built tools for that.
        </h1>
        <p className="mt-6 text-lg text-white/85">
          UnstuckLabs makes small, focused tools that break big, overwhelming tasks into steps
          you can actually start — no bloated dashboard, no thirty-minute setup.
        </p>
        <Card className="mx-auto mt-8 max-w-md hover:shadow-md">
          <WaitlistForm source="waitlist:hero" />
        </Card>
        <p className="mt-3 text-sm text-white/70">Free to join. No spam, just launch updates.</p>
      </div>
    </section>
  );
}
