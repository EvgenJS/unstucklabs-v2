import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { TaskBreakdown } from "@unstucklabs/sdk";
import { getApiClient, PRODUCT_SLUG } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { emptyData, type UnstuckDailyData } from "../lib/types";
import { checkNewAchievements } from "../lib/achievements";

interface AppDataContextValue {
  data: UnstuckDailyData;
  loading: boolean;
  newlyUnlocked: string[];
  clearNewlyUnlocked: () => void;
  startTask: (title: string, brainDump: string | undefined, breakdown: TaskBreakdown) => void;
  completeSubtask: (subtaskId: string) => void;
  abandonTask: () => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

const WRITE_DEBOUNCE_MS = 800;

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { accessToken } = useAuth();
  const [data, setData] = useState<UnstuckDailyData>(emptyData());
  const [loading, setLoading] = useState(true);
  const [newlyUnlocked, setNewlyUnlocked] = useState<string[]>([]);
  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestData = useRef(data);
  latestData.current = data;

  useEffect(() => {
    if (!accessToken) return;
    getApiClient(accessToken)
      .appUserData.get(PRODUCT_SLUG)
      .then(({ data: remote }) => {
        if (remote) setData(remote as UnstuckDailyData);
      })
      .finally(() => setLoading(false));
  }, [accessToken]);

  const flush = useCallback(() => {
    if (!accessToken) return;
    if (writeTimer.current) clearTimeout(writeTimer.current);
    writeTimer.current = null;
    getApiClient(accessToken).appUserData.put(PRODUCT_SLUG, latestData.current);
  }, [accessToken]);

  const scheduleWrite = useCallback(() => {
    if (writeTimer.current) clearTimeout(writeTimer.current);
    writeTimer.current = setTimeout(flush, WRITE_DEBOUNCE_MS);
  }, [flush]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "hidden") flush();
    }
    window.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("beforeunload", flush);
    };
  }, [flush]);

  function update(updater: (current: UnstuckDailyData) => UnstuckDailyData) {
    setData((current) => {
      const next = updater(current);
      latestData.current = next;
      return next;
    });
    scheduleWrite();
  }

  function startTask(title: string, brainDump: string | undefined, breakdown: TaskBreakdown) {
    update((current) => ({
      ...current,
      currentTask: {
        id: crypto.randomUUID(),
        title,
        brainDump,
        createdAt: new Date().toISOString(),
        aiEstimateMinutes: breakdown.estimateMinutes,
        encouragement: breakdown.encouragement,
        subtasks: breakdown.subtasks.map((t) => ({
          id: crypto.randomUUID(),
          title: t,
          completed: false,
          completedAt: null,
        })),
        status: "active",
      },
      lastActivityAt: new Date().toISOString(),
    }));
  }

  function completeSubtask(subtaskId: string) {
    update((current) => {
      const task = current.currentTask;
      if (!task) return current;

      const subtasks = task.subtasks.map((s) =>
        s.id === subtaskId ? { ...s, completed: true, completedAt: new Date().toISOString() } : s
      );
      const allDone = subtasks.every((s) => s.completed);

      if (!allDone) {
        return {
          ...current,
          currentTask: { ...task, subtasks },
          lastActivityAt: new Date().toISOString(),
        };
      }

      const completedTask = { ...task, subtasks, status: "completed" as const };
      const unlocked = checkNewAchievements(current, completedTask, current.lastActivityAt);
      if (unlocked.length > 0) setNewlyUnlocked((prev) => [...prev, ...unlocked]);

      const now = new Date().toISOString();
      const actualMinutes = Math.round((Date.now() - new Date(task.createdAt).getTime()) / 60000);

      return {
        ...current,
        currentTask: null,
        history: [
          {
            taskId: task.id,
            title: task.title,
            completedAt: now,
            totalSubtasks: subtasks.length,
            completedSubtasks: subtasks.length,
            aiEstimateMinutes: task.aiEstimateMinutes,
            actualMinutes,
          },
          ...current.history,
        ],
        achievements: {
          unlocked: [
            ...current.achievements.unlocked,
            ...unlocked.map((id) => ({ id, unlockedAt: now })),
          ],
          stats: {
            totalTasksCompleted: current.achievements.stats.totalTasksCompleted + 1,
            totalSubtasksCompleted: current.achievements.stats.totalSubtasksCompleted + subtasks.length,
          },
        },
        lastActivityAt: now,
      };
    });
    flush();
  }

  function abandonTask() {
    update((current) => ({ ...current, currentTask: null, lastActivityAt: new Date().toISOString() }));
    flush();
  }

  function clearNewlyUnlocked() {
    setNewlyUnlocked([]);
  }

  return (
    <AppDataContext.Provider
      value={{ data, loading, newlyUnlocked, clearNewlyUnlocked, startTask, completeSubtask, abandonTask }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
