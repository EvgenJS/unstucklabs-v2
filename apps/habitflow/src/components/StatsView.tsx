import { Card } from "@unstucklabs/ui";
import type { CompletionsByDate, Habit } from "../lib/types";
import { dateKey } from "../lib/streaks";

interface Props {
  habits: Habit[];
  completions: CompletionsByDate;
  longestStreakEver: Record<string, number>;
  onBack: () => void;
}

const DAYS_SHOWN = 30;

// Simple CSS bars, no charting library -- keeps the bundle small, matches
// the rest of the repo (Unstuck Daily's History view is similarly
// client-computed with no chart dependency).
export function StatsView({ habits, completions, longestStreakEver, onBack }: Props) {
  const activeHabits = habits.filter((h) => !h.archivedAt);
  const today = new Date();

  const days = Array.from({ length: DAYS_SHOWN }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (DAYS_SHOWN - 1 - i));
    return d;
  });

  const rates = days.map((d) => {
    const key = dateKey(d);
    const done = (completions[key] ?? []).length;
    return activeHabits.length > 0 ? done / activeHabits.length : 0;
  });

  const totalCompletions = Object.values(completions).reduce((sum, ids) => sum + ids.length, 0);
  const longestStreak = Math.max(0, ...Object.values(longestStreakEver));

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-6 py-8">
      <button type="button" onClick={onBack} className="cursor-pointer self-start text-sm text-foreground/50 hover:text-foreground">
        ← Back
      </button>
      <h1 className="mt-2 text-2xl font-bold text-foreground">Stats</h1>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <Card>
          <p className="text-sm text-foreground/60">Longest streak</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {longestStreak} day{longestStreak === 1 ? "" : "s"}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-foreground/60">Total check-ins</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{totalCompletions}</p>
        </Card>
      </div>

      <Card className="mt-4">
        <p className="text-sm font-medium text-foreground">Last {DAYS_SHOWN} days</p>
        <div className="mt-4 flex h-32 items-end gap-1">
          {rates.map((rate, i) => (
            <div key={i} className="flex-1 rounded-t bg-muted" style={{ height: "100%" }}>
              <div
                className="w-full rounded-t bg-primary"
                style={{ height: `${Math.round(rate * 100)}%`, marginTop: `${Math.round((1 - rate) * 100)}%` }}
              />
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-foreground/40">Daily completion rate across all active habits</p>
      </Card>
    </div>
  );
}
