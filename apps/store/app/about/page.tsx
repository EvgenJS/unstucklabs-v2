import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Why UnstuckLabs exists and who's behind it.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold text-foreground">About UnstuckLabs</h1>

      <div className="mt-8 space-y-6 text-foreground/80">
        <p>
          UnstuckLabs makes small, focused tools for people who get stuck on the same thing over and
          over: starting. Not planning, not deciding — just starting. Most productivity software assumes
          that part is already solved. It isn&apos;t, for a lot of people.
        </p>
        <p>
          Instead of one large app trying to do everything, UnstuckLabs is a growing set of small tools —
          each one built to solve a single, specific version of that problem, sold on its own so you only
          pay for what actually helps you.
        </p>
        <p>
          UnstuckLabs is built and run by <strong>Yevhen Spatar</strong>, operating independently as an
          individual based in Ukraine — not a large company, not a registered legal entity. Every tool
          ships because I needed it myself first.
        </p>
      </div>
    </div>
  );
}
