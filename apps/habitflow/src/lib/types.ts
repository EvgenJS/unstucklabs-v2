export interface Habit {
  id: string;
  name: string;
  emoji: string;
  action: string;
  time: string;
  place: string;
  createdAt: string;
  archivedAt: string | null; // soft-delete -- never hard-delete a habit with completion history
}

// Keyed by ISO date string (YYYY-MM-DD) -> array of habitIds completed that
// day. Bounded, rolling ~90-day retention (pruned client-side on write) --
// deliberately not v1's unbounded flat `completions: [String]` per habit,
// which grows forever and is rescanned in full for every streak calc.
export type CompletionsByDate = Record<string, string[]>;

export interface RecoveryUsage {
  habitId: string;
  usedAt: string;
}

export interface HabitFlowData {
  version: 1;
  habits: Habit[];
  completions: CompletionsByDate;
  longestStreakEver: Record<string, number>; // habitId -> never pruned, unlike completions
  recoveries: RecoveryUsage[]; // pruned >60 days, naturally small (capped by the 1/week/habit server guard)
  aiUsage: { date: string; callsToday: number };
  recoveryUsage: { date: string; callsToday: number };
  lastCheckInAt: string | null;
}

export function emptyData(): HabitFlowData {
  const today = new Date().toISOString().slice(0, 10);
  return {
    version: 1,
    habits: [],
    completions: {},
    longestStreakEver: {},
    recoveries: [],
    aiUsage: { date: today, callsToday: 0 },
    recoveryUsage: { date: today, callsToday: 0 },
    lastCheckInAt: null,
  };
}
