const steps = [
  { step: "1", title: "Pick a tool", description: "Browse the catalog and find the one that matches what you're stuck on." },
  { step: "2", title: "Subscribe", description: "Pay only for that tool — one-time or monthly, whichever fits it." },
  { step: "3", title: "Launch it", description: "Each app opens instantly on its own address — installable, no download required." },
];

export function HowItWorks() {
  return (
    <section className="bg-muted/40 py-16">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="text-center text-2xl font-bold text-foreground">How it works</h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {steps.map((item) => (
            <div key={item.step} className="text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-on-primary">
                {item.step}
              </div>
              <h3 className="mt-4 font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm text-foreground/70">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
