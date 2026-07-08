import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "@unstucklabs/ui";
import type { CurrentTask } from "../lib/types";
import { FocusTimer } from "./FocusTimer";

interface Props {
  task: CurrentTask;
  onCompleteSubtask: (subtaskId: string) => void;
  onAbandon: () => void;
  onViewHistory: () => void;
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
            <Button className="mt-6" onClick={() => onCompleteSubtask(nextSubtask.id)}>
              Done, next step
            </Button>
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
