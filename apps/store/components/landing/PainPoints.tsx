const scenarios = [
  {
    title: "You know what to do. You just can't start.",
    description: "The task sits there for days. Not because it's hard — because it's too big to grab onto.",
  },
  {
    title: "You've abandoned a dozen habit trackers.",
    description: "Streaks reset, motivation fades, and the app becomes one more thing you're failing at.",
  },
  {
    title: "Every tool wants to be your whole life.",
    description: "You just needed help with one thing. Instead you got a workspace, a wiki, and a subscription for all of it.",
  },
];

export function PainPoints() {
  return (
    <section className="bg-muted/40 py-16">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          {scenarios.map((item) => (
            <div key={item.title}>
              <h3 className="font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm text-foreground/70">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
