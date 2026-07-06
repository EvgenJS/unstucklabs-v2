import { WaitlistForm } from "../WaitlistForm";

export function FinalCta() {
  return (
    <section className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h2 className="text-2xl font-bold text-foreground">Ready to get unstuck?</h2>
      <p className="mt-3 text-foreground/70">Join the waitlist and be first to know when a new tool launches.</p>
      <WaitlistForm source="waitlist:landing-footer-cta" className="mx-auto mt-6 max-w-md" />
    </section>
  );
}
