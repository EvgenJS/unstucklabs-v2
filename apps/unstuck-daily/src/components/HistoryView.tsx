import { Card } from "@unstucklabs/ui";
import type { HistoryEntry } from "../lib/types";
import { ACHIEVEMENTS } from "../lib/achievements";
import type { Achievement } from "../lib/types";

interface Props {
  history: HistoryEntry[];
  unlockedAchievements: Achievement[];
  onBack: () => void;
}

export function HistoryView({ history, unlockedAchievements, onBack }: Props) {
  const unlockedIds = new Set(unlockedAchievements.map((a) => a.id));

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-6 py-12">
      <button type="button" onClick={onBack} className="cursor-pointer text-sm text-foreground/50 hover:text-foreground">
        ← Back
      </button>
      <h1 className="mt-4 text-2xl font-bold text-foreground">What you've done</h1>

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/50">Badges</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {ACHIEVEMENTS.map((a) => (
            <Card key={a.id} className={`p-3 ${unlockedIds.has(a.id) ? "" : "opacity-40 grayscale"}`}>
              <p className="text-sm font-semibold text-foreground">{a.label}</p>
              <p className="mt-1 text-xs text-foreground/60">{a.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/50">Completed tasks</h2>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-foreground/60">Nothing yet -- your first finished task will show up here.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {history.map((entry) => (
              <li key={entry.taskId} className="rounded-lg border border-border bg-white px-4 py-3">
                <p className="font-medium text-foreground">{entry.title}</p>
                <p className="mt-1 text-xs text-foreground/50">
                  {new Date(entry.completedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  · {entry.completedSubtasks} steps
                  {entry.actualMinutes != null ? ` · ${entry.actualMinutes} min` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
