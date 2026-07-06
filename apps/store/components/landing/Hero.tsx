import { WaitlistForm } from "../WaitlistForm";

export function Hero() {
  return (
    <section className="mx-auto max-w-3xl px-6 pt-20 pb-16 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        Starting is the hard part. We built tools for that.
      </h1>
      <p className="mt-6 text-lg text-foreground/70">
        UnstuckLabs makes small, focused tools that break big, overwhelming tasks into steps
        you can actually start — no bloated dashboard, no thirty-minute setup.
      </p>
      <WaitlistForm source="waitlist:hero" className="mx-auto mt-8 max-w-md" />
      <p className="mt-3 text-sm text-foreground/50">Free to join. No spam, just launch updates.</p>
    </section>
  );
}
