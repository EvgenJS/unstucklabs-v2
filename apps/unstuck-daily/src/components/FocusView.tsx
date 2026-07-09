import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "@unstucklabs/ui";
import type { Resource } from "@unstucklabs/sdk";
import type { CurrentTask } from "../lib/types";
import { FocusTimer } from "./FocusTimer";
import { getApiClient } from "../lib/api";
import { useAuth } from "../lib/auth-context";

interface Props {
  task: CurrentTask;
  onCompleteSubtask: (subtaskId: string) => void;
  onAbandon: () => void;
  onViewHistory: () => void;
}

// Opt-in per-subtask link finder -- separate component so its state
// (resources fetched, loading, error) naturally resets whenever the parent
// remounts it with a new `key` (see usage below), instead of needing manual
// resets on every subtask change.
function FindResources({ subtaskTitle, taskTitle }: { subtaskTitle: string; taskTitle: string }) {
  const { accessToken } = useAuth();
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [resources, setResources] = useState<Resource[]>([]);

  async function handleClick() {
    if (!accessToken) return;
    setState("loading");
    try {
      const { resources: found } = await getApiClient(accessToken).unstuckDaily.ai.findResources(
        subtaskTitle,
        taskTitle
      );
      setResources(found);
      setState("idle");
    } catch {
      setState("error");
    }
  }

  if (resources.length > 0) {
    return (
      <ul className="mt-4 flex w-full flex-col gap-2 text-left">
        {resources.map((r) => (
          <li key={r.url}>
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg border border-border px-3 py-2 text-sm text-primary hover:underline"
            >
              {r.title}
            </a>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={state === "loading"}
      className="mt-4 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-accent hover:text-accent/80 disabled:cursor-wait"
    >
      <span aria-hidden="true">🔎</span>
      {state === "loading"
        ? "Looking…"
        : state === "error"
          ? "Couldn't find anything -- try again?"
          : "Find resources for this step"}
    </button>
  );
}

export function FocusView({ task, onCompleteSubtask, onAbandon, onViewHistory }: Props) {
  const [showAll, setShowAll] = useState(false);
  const reducedMotion = useReducedMotion();
  const nextSubtask = task.subtasks.find((s) => !s.completed);
  const completedCount = task.subtasks.filter((s) => s.completed).length;

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center px-6 py-12 text-center">
      <div className="flex w-full items-center justify-between">
        <p className="text-sm font-medium text-primary">{task.title}</p>
        <button type="button" onClick={onViewHistory} className="cursor-pointer text-sm text-foreground/50 hover:text-foreground">
          History
        </button>
      </div>

      <p className="mt-1 text-xs text-foreground/40">
        {completedCount} of {task.subtasks.length} done
      </p>

      <div className="mt-10">
        <FocusTimer startedAt={task.createdAt} />
      </div>

      <AnimatePresence mode="wait">
        {nextSubtask && (
          <motion.div
            key={nextSubtask.id}
            initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="mt-10 w-full"
          >
            <p className="text-xl font-semibold text-foreground">{nextSubtask.title}</p>
            <div className="mt-6 flex flex-col items-center">
              <Button onClick={() => onCompleteSubtask(nextSubtask.id)}>Done, next step</Button>
              <FindResources key={nextSubtask.id} subtaskTitle={nextSubtask.title} taskTitle={task.title} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="cursor-pointer text-sm text-foreground/50 hover:text-foreground"
        >
          {showAll ? "Hide full list" : "See all steps"}
        </button>

        {showAll && (
          <ul className="flex w-full flex-col gap-2 text-left">
            {task.subtasks.map((s) => (
              <li
                key={s.id}
                className={`flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm ${
                  s.completed ? "text-foreground/40 line-through" : "text-foreground"
                }`}
              >
                {s.title}
              </li>
            ))}
          </ul>
        )}

        <button type="button" onClick={onAbandon} className="cursor-pointer text-sm text-foreground/40 hover:text-destructive">
          Set this aside for now
        </button>
      </div>
    </div>
  );
}
