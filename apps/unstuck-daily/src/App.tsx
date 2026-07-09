import { useEffect, useState } from "react";
import type { TaskBreakdown } from "@unstucklabs/sdk";
import { AuthProvider } from "./lib/auth-context";
import { SubscriptionGate } from "./components/SubscriptionGate";
import { AppDataProvider, useAppData } from "./context/AppDataProvider";
import { TaskInput } from "./components/TaskInput";
import { BreakdownView } from "./components/BreakdownView";
import { FocusView } from "./components/FocusView";
import { CompletionView } from "./components/CompletionView";
import { HistoryView } from "./components/HistoryView";
import { PushPermissionBanner } from "./components/PushPermissionBanner";
import { ErrorBoundary } from "./components/ErrorBoundary";

type Screen = "input" | "breakdown" | "focus" | "completion" | "history";

interface PendingBreakdown {
  title: string;
  brainDump: string | undefined;
  breakdown: TaskBreakdown;
}

interface JustCompleted {
  taskTitle: string;
  completedSubtasks: number;
  actualMinutes: number | null;
}

function AppContent() {
  const { data, loading, newlyUnlocked, clearNewlyUnlocked, startTask, completeSubtask, abandonTask } = useAppData();
  const [screen, setScreen] = useState<Screen>("input");
  const [pending, setPending] = useState<PendingBreakdown | null>(null);
  const [justCompleted, setJustCompleted] = useState<JustCompleted | null>(null);

  useEffect(() => {
    if (!loading && data.currentTask && screen === "input") {
      setScreen("focus");
    }
    // Only re-run when the loading flag flips (i.e. once, after the initial
    // fetch resolves) -- afterwards `screen` is driven by user actions, not
    // by `data.currentTask` changing underneath it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-foreground/60">Loading…</p>
      </div>
    );
  }

  function handleBreakdown(title: string, brainDump: string | undefined, breakdown: TaskBreakdown) {
    setPending({ title, brainDump, breakdown });
    setScreen("breakdown");
  }

  function handleStart() {
    if (!pending) return;
    startTask(pending.title, pending.brainDump, pending.breakdown);
    setPending(null);
    setScreen("focus");
  }

  function handleCompleteSubtask(subtaskId: string) {
    const task = data.currentTask;
    if (!task) return;
    const isLast = task.subtasks.filter((s) => !s.completed).length === 1;
    completeSubtask(subtaskId);
    if (isLast) {
      setJustCompleted({
        taskTitle: task.title,
        completedSubtasks: task.subtasks.length,
        actualMinutes: Math.round((Date.now() - new Date(task.createdAt).getTime()) / 60000),
      });
      setScreen("completion");
    }
  }

  return (
    <>
      <PushPermissionBanner />
      {screen === "input" && (
        <TaskInput onBreakdown={handleBreakdown} onViewHistory={() => setScreen("history")} />
      )}
      {screen === "breakdown" && pending && (
        <BreakdownView
          title={pending.title}
          breakdown={pending.breakdown}
          onStart={handleStart}
          onBack={() => {
            setPending(null);
            setScreen("input");
          }}
        />
      )}
      {screen === "focus" && data.currentTask && (
        <FocusView
          task={data.currentTask}
          onCompleteSubtask={handleCompleteSubtask}
          onAbandon={() => {
            abandonTask();
            setScreen("input");
          }}
          onViewHistory={() => setScreen("history")}
        />
      )}
      {screen === "completion" && justCompleted && (
        <CompletionView
          taskTitle={justCompleted.taskTitle}
          completedSubtasks={justCompleted.completedSubtasks}
          actualMinutes={justCompleted.actualMinutes}
          newlyUnlocked={newlyUnlocked}
          onStartNew={() => {
            clearNewlyUnlocked();
            setJustCompleted(null);
            setScreen("input");
          }}
          onViewHistory={() => setScreen("history")}
        />
      )}
      {screen === "history" && (
        <HistoryView
          history={data.history}
          unlockedAchievements={data.achievements.unlocked}
          onBack={() => setScreen(data.currentTask ? "focus" : "input")}
        />
      )}
    </>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SubscriptionGate>
          <AppDataProvider>
            <AppContent />
          </AppDataProvider>
        </SubscriptionGate>
      </AuthProvider>
    </ErrorBoundary>
  );
}
