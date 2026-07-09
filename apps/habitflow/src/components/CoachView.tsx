import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@unstucklabs/ui";
import { ApiError, type HabitCoachResult } from "@unstucklabs/sdk";
import type { CompletionsByDate, Habit } from "../lib/types";
import { computeStreak, countRecentCompletions } from "../lib/streaks";
import { getApiClient } from "../lib/api";

interface Props {
  habits: Habit[];
  completions: CompletionsByDate;
  accessToken: string | undefined;
  onBack: () => void;
}

const RADIUS = 80;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const INSIGHT_STYLES: Record<HabitCoachResult["insights"][number]["type"], string> = {
  success: "border-primary/30 bg-primary/5",
  warning: "border-accent/30 bg-accent/5",
  tip: "border-border bg-muted",
};

export function CoachView({ habits, completions, accessToken, onBack }: Props) {
  const [result, setResult] = useState<HabitCoachResult | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const activeHabits = habits.filter((h) => !h.archivedAt);

  async function handleFetch() {
    setStatus("loading");
    setError(null);
    try {
      const summary = activeHabits.map((h) => ({
        name: h.name,
        streak: computeStreak(h.id, completions),
        last7DaysCompleted: countRecentCompletions(h.id, completions),
      }));
      const res = await getApiClient(accessToken).habitflow.ai.coach(summary);
      setResult(res);
      setStatus("idle");
    } catch (err) {
      setError(
        err instanceof ApiError && typeof err.body === "object" && err.body && "error" in err.body
          ? String((err.body as { error: string }).error)
          : "Couldn't reach the AI coach just now -- try again in a moment."
      );
      setStatus("error");
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center px-6 py-8 text-center">
      <button
        type="button"
        onClick={onBack}
        className="cursor-pointer self-start text-sm text-foreground/50 hover:text-foreground"
      >
        ← Back
      </button>
      <h1 className="mt-2 text-2xl font-bold text-foreground">AI Coach</h1>

      {activeHabits.length === 0 ? (
        <p className="mt-10 text-foreground/60">Add a habit first, then your coach will have something to work with.</p>
      ) : !result ? (
        <div className="mt-10 flex flex-col items-center gap-4">
          <p className="max-w-sm text-foreground/70">
            Get a weekly consistency check-in -- a score, some encouragement, and a few specific insights.
          </p>
          <Button onClick={handleFetch} disabled={status === "loading"}>
            {status === "loading" ? "Thinking…" : "Get my check-in"}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      ) : (
        <div className="mt-8 flex w-full flex-col items-center gap-6">
          <ConsistencyRing score={result.consistencyScore} />
          <p className="text-foreground/80">{result.encouragement}</p>

          <div className="flex w-full flex-col gap-3 text-left">
            {result.insights.map((insight, i) => (
              <div key={i} className={`rounded-xl border p-4 text-sm ${INSIGHT_STYLES[insight.type]}`}>
                {insight.text}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleFetch}
            disabled={status === "loading"}
            className="cursor-pointer text-sm text-foreground/50 hover:text-foreground"
          >
            {status === "loading" ? "Refreshing…" : "↻ Refresh"}
          </button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )}
    </div>
  );
}

// Static progress ring reusing the same SVG-radial visual language as
// Unstuck Daily's "the glow" focus timer, for cross-app brand consistency.
function ConsistencyRing({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const dashOffset = CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <div className="relative flex h-44 w-44 items-center justify-center">
      <motion.svg
        width="176"
        height="176"
        viewBox="0 0 176 176"
        initial={{ rotate: -90 }}
        animate={{ rotate: -90 }}
        className="absolute inset-0"
      >
        <circle cx="88" cy="88" r={RADIUS} fill="none" stroke="var(--color-muted)" strokeWidth="10" />
        <motion.circle
          cx="88"
          cy="88"
          r={RADIUS}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </motion.svg>
      <div className="relative text-center">
        <p className="text-3xl font-bold text-foreground">{clamped}</p>
        <p className="text-xs text-foreground/50">consistency</p>
      </div>
    </div>
  );
}
