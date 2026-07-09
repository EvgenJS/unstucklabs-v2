export interface Habit {
  id: string;
  name: string;
  emoji: string;
  action: string;
  time: string;
  place: string;
  color: string; // hex, assigned once at creation from ACCENT_COLORS -- distinguishes habits at a glance in the week grid
  createdAt: string;
  archivedAt: string | null; // soft-delete -- never hard-delete a habit with completion history
}

// Per-habit accent palette -- rotated by creation order, not user-picked, so
// Add Habit stays a single short form (no color-picker UI). Each is a
// saturated ~600-level tone that reads clearly against the cream background
// and gives enough contrast for a white checkmark/icon on top of a solid fill.
export const ACCENT_COLORS = [
  "#DC2626", // red
  "#D97706", // amber
  "#0D9488", // teal
  "#7C3AED", // violet
  "#16A34A", // green
  "#2563EB", // blue
];

export function nextAccentColor(existingHabitCount: number): string {
  return ACCENT_COLORS[existingHabitCount % ACCENT_COLORS.length]!;
}

// Backfills `color` on habits persisted before this field existed (the
// remote AppUserData blob is versioned but read-whole/write-whole, so old
// data can lack fields a newer client expects -- see HabitFlowData.version).
export function withHabitColors(data: HabitFlowData): HabitFlowData {
  if (data.habits.every((h) => h.color)) return data;
  return { ...data, habits: data.habits.map((h, i) => (h.color ? h : { ...h, color: nextAccentColor(i) })) };
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
