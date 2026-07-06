import { AppRequestForm } from "../AppRequestForm";

export function CoCreation() {
  return (
    <section className="bg-primary/5 py-16">
      <div className="mx-auto max-w-2xl px-6 text-center">
        <h2 className="text-2xl font-bold text-foreground">Help shape what we build next</h2>
        <p className="mt-3 text-foreground/70">
          Tell us what you&apos;re stuck on. We&apos;ll confirm the idea with you before building it —
          and if you helped shape it, you get free early access.
        </p>
        <AppRequestForm className="mx-auto mt-8 max-w-md text-left" />
      </div>
    </section>
  );
}
