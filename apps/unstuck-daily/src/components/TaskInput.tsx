import { useState } from "react";
import { Button } from "@unstucklabs/ui";
import type { TaskBreakdown } from "@unstucklabs/sdk";
import { ApiError } from "@unstucklabs/sdk";
import { getApiClient } from "../lib/api";
import { useAuth } from "../lib/auth-context";

interface Props {
  onBreakdown: (title: string, brainDump: string | undefined, breakdown: TaskBreakdown) => void;
  onViewHistory: () => void;
}

export function TaskInput({ onBreakdown, onViewHistory }: Props) {
  const { accessToken } = useAuth();
  const [brainDump, setBrainDump] = useState("");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    setStatus("loading");
    setError(null);
    try {
      const breakdown = await getApiClient(accessToken ?? undefined).unstuckDaily.ai.splitTask(
        title.trim(),
        brainDump.trim() || undefined
      );
      onBreakdown(title.trim(), brainDump.trim() || undefined, breakdown);
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
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">What's the one big thing?</h1>
        <button
          type="button"
          onClick={onViewHistory}
          className="cursor-pointer whitespace-nowrap text-sm text-foreground/50 hover:text-foreground"
        >
          History
        </button>
      </div>
      <p className="mt-2 text-foreground/70">
        Paste the task that's been sitting there. We'll break it into steps small enough to actually start.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <div>
          <label htmlFor="brain-dump" className="mb-1 block text-sm font-medium text-foreground">
            Clear your head first (optional)
          </label>
          <textarea
            id="brain-dump"
            value={brainDump}
            onChange={(e) => setBrainDump(e.target.value)}
            rows={3}
            placeholder="Anything on your mind about this task -- worries, context, whatever's in the way."
            className="w-full rounded-lg border border-border bg-white px-4 py-3 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label htmlFor="task-title" className="mb-1 block text-sm font-medium text-foreground">
            The task
          </label>
          <textarea
            id="task-title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            rows={2}
            placeholder="e.g. Clean out the garage"
            className="w-full rounded-lg border border-border bg-white px-4 py-3 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" disabled={status === "loading" || !title.trim()}>
          {status === "loading" ? "Breaking it down…" : "Break it down"}
        </Button>
      </form>
    </div>
  );
}
