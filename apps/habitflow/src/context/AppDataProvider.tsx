import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { getApiClient, PRODUCT_SLUG } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { emptyData, nextAccentColor, withHabitColors, type Habit, type HabitFlowData } from "../lib/types";
import { computeStreak, dateKey, pruneCompletions, pruneRecoveries, updateLongestStreak } from "../lib/streaks";

interface NewHabitInput {
  name: string;
  emoji: string;
  action: string;
  time: string;
  place: string;
}

interface AppDataContextValue {
  data: HabitFlowData;
  loading: boolean;
  addHabit: (input: NewHabitInput) => void;
  editHabit: (habitId: string, updates: Partial<NewHabitInput>) => void;
  archiveHabit: (habitId: string) => void;
  checkOffHabit: (habitId: string) => void;
  applyRecoveryDay: (habitId: string) => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

const WRITE_DEBOUNCE_MS = 800;

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { accessToken } = useAuth();
  const [data, setData] = useState<HabitFlowData>(emptyData());
  const [loading, setLoading] = useState(true);
  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestData = useRef(data);
  latestData.current = data;

  useEffect(() => {
    if (!accessToken) return;
    getApiClient(accessToken)
      .appUserData.get(PRODUCT_SLUG)
      .then(({ data: remote }) => {
        if (remote) setData(withHabitColors(remote as HabitFlowData));
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

  // Computes `next` synchronously against the ref (not via setData's own
  // functional-updater form) so latestData.current is correct the instant
  // this call returns -- a call to flush() right after update() needs that
  // guarantee, or it ships the pre-update snapshot. This is the exact bug
  // Unstuck Daily hit and fixed (see docs/ROADMAP.md's Phase 4+ follow-up);
  // ported the fix here from the start rather than re-discovering it.
  function update(updater: (current: HabitFlowData) => HabitFlowData) {
    const next = updater(latestData.current);
    latestData.current = next;
    setData(next);
    scheduleWrite();
  }

  function addHabit(input: NewHabitInput) {
    const current = latestData.current;
    const habit: Habit = {
      id: crypto.randomUUID(),
      name: input.name,
      emoji: input.emoji,
      action: input.action,
      time: input.time,
      place: input.place,
      color: nextAccentColor(current.habits.length),
      createdAt: new Date().toISOString(),
      archivedAt: null,
    };
    update((c) => ({ ...c, habits: [...c.habits, habit] }));
    flush();
  }

  function editHabit(habitId: string, updates: Partial<NewHabitInput>) {
    update((c) => ({
      ...c,
      habits: c.habits.map((h) => (h.id === habitId ? { ...h, ...updates } : h)),
    }));
    flush();
  }

  function archiveHabit(habitId: string) {
    update((c) => ({
      ...c,
      habits: c.habits.map((h) => (h.id === habitId ? { ...h, archivedAt: new Date().toISOString() } : h)),
    }));
    flush();
  }

  // Tap-to-toggle -- checking off a habit twice undoes an accidental tap.
  function checkOffHabit(habitId: string) {
    const current = latestData.current;
    const now = new Date();
    const todayKey = dateKey(now);
    const doneToday = new Set(current.completions[todayKey] ?? []);
    const wasComplete = doneToday.has(habitId);
    if (wasComplete) doneToday.delete(habitId);
    else doneToday.add(habitId);

    const nextCompletions = pruneCompletions({ ...current.completions, [todayKey]: [...doneToday] }, now);
    const newStreak = computeStreak(habitId, nextCompletions, now);
    const nextLongest = updateLongestStreak(current.longestStreakEver, habitId, newStreak);

    update((c) => ({
      ...c,
      completions: nextCompletions,
      longestStreakEver: nextLongest,
      lastCheckInAt: wasComplete ? c.lastCheckInAt : now.toISOString(),
    }));
    flush();
  }

  // Applies an accepted AI recovery-day suggestion: counts as completing
  // the habit today (preserving the streak) and records the usage so the
  // client-side 7-day guard (mirroring the server's real enforcement) has
  // an up-to-date view. See docs/ROADMAP.md's known-simplification note on
  // the narrow last-write-wins window between this and the AI route's own
  // server-side write of the same usage record.
  function applyRecoveryDay(habitId: string) {
    const current = latestData.current;
    const now = new Date();
    const todayKey = dateKey(now);
    const doneToday = new Set(current.completions[todayKey] ?? []);
    doneToday.add(habitId);

    const nextCompletions = pruneCompletions({ ...current.completions, [todayKey]: [...doneToday] }, now);
    const newStreak = computeStreak(habitId, nextCompletions, now);
    const nextLongest = updateLongestStreak(current.longestStreakEver, habitId, newStreak);
    const nextRecoveries = pruneRecoveries([...current.recoveries, { habitId, usedAt: now.toISOString() }], now);

    update((c) => ({
      ...c,
      completions: nextCompletions,
      longestStreakEver: nextLongest,
      recoveries: nextRecoveries,
      lastCheckInAt: now.toISOString(),
    }));
    flush();
  }

  return (
    <AppDataContext.Provider
      value={{ data, loading, addHabit, editHabit, archiveHabit, checkOffHabit, applyRecoveryDay }}
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
