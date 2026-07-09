import { useEffect, useState } from "react";
import { Button } from "@unstucklabs/ui";
import { ApiError, type RecoveryDaySuggestion } from "@unstucklabs/sdk";
import type { Habit } from "../lib/types";
import { getApiClient } from "../lib/api";

interface Props {
  habit: Habit;
  accessToken: string | undefined;
  onAccept: () => void;
  onClose: () => void;
}

// Tapping "Recover your streak" (which opens this modal) IS the commitment
// -- the AI call fires immediately on open, and core-api records the usage
// at that point (server-enforced 1/week/habit guard), same semantic as v1's
// freeze-on-click. This modal just shows what the user gets in return.
export function RecoveryDayModal({ habit, accessToken, onAccept, onClose }: Props) {
  const [suggestion, setSuggestion] = useState<RecoveryDaySuggestion | null>(null);
  const [status, setStatus] = useState<"loading" | "idle" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getApiClient(accessToken)
      .habitflow.ai.recoveryDay(habit.id, habit.name)
      .then((res) => {
        if (!cancelled) {
          setSuggestion(res);
          setStatus("idle");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError && typeof err.body === "object" && err.body && "error" in err.body
            ? String((err.body as { error: string }).error)
            : "Couldn't reach the AI coach just now -- try again in a moment."
        );
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habit.id]);

  function handleAccept() {
    onAccept();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <p className="text-sm font-medium text-accent">Recovery day</p>

        {status === "loading" && <p className="mt-4 text-foreground/60">Thinking of something small…</p>}
        {status === "error" && (
          <>
            <p className="mt-4 text-sm text-destructive">{error}</p>
            <Button variant="secondary" className="mt-4" onClick={onClose}>
              Close
            </Button>
          </>
        )}
        {suggestion && (
          <>
            <p className="mt-3 text-lg font-semibold text-foreground">{suggestion.suggestion}</p>
            <p className="mt-2 text-sm text-foreground/60">{suggestion.rationale}</p>
            <div className="mt-6 flex gap-3">
              <Button onClick={handleAccept}>Done, that counts</Button>
              <Button variant="secondary" onClick={onClose}>
                Not now
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
