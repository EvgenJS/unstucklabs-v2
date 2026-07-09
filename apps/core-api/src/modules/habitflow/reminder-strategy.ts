import type { ReminderStrategy } from "../push/reminder-strategy.types.js";

interface HabitFlowHabit {
  id: string;
  archivedAt: string | null;
}

interface HabitFlowReminderData {
  habits?: HabitFlowHabit[];
  completions?: Record<string, string[]>; // date -> habitIds completed that day
  lastCheckInAt?: string | null;
}

// Baseline idle threshold before a "haven't checked in today" nudge fires.
const DEFAULT_IDLE_HOURS = 20;
// On a day historically prone to misses (see dayOfWeekMissRate below), fire
// sooner -- the "smart push" idea from product research, implemented as
// deterministic stats over the user's own history rather than a new AI call
// (the scheduler ticks for every user on every interval; an LLM call per
// tick would be slow and expensive for a concept this simple).
const PREDICTIVE_IDLE_HOURS = 8;
const MIN_SAMPLES_FOR_PREDICTION = 3;
const HIGH_MISS_RATE_THRESHOLD = 0.5;
const LOOKBACK_DAYS = 60;
const MAX_SAMPLES = 8;

// Local calendar date, matching the exact algorithm the client uses (see
// apps/habitflow/src/lib/streaks.ts's dateKey) -- NOT toISOString(), which
// is UTC-based and would silently shift every lookup by a day in any
// positive-UTC-offset timezone. Known simplification: this makes date keys
// consistent with the *server's* own local timezone, not each individual
// user's -- acceptable for a single-timezone self-hosted deployment (same
// caveat already documented for the scheduler's single-process assumption);
// revisit only if users in materially different timezones report the
// "today" boundary landing on the wrong day for them specifically.
function dateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Fraction of the last several occurrences of `weekday` where not all
// active habits were completed. Returns null if there isn't enough history
// yet to say anything meaningful. Known simplification: doesn't account for
// habits created partway through the lookback window, so a habit added
// last week can make earlier dates look like false misses -- acceptable
// for a "soft nudge" heuristic, not used for anything else.
function dayOfWeekMissRate(
  completions: Record<string, string[]>,
  activeHabitIds: string[],
  weekday: number,
  now: Date
): number | null {
  let samples = 0;
  let misses = 0;
  const cursor = new Date(now);
  cursor.setDate(cursor.getDate() - 1); // start from yesterday, walk backward

  for (let i = 0; i < LOOKBACK_DAYS && samples < MAX_SAMPLES; i++) {
    if (cursor.getDay() === weekday) {
      const key = dateKey(cursor);
      const done = new Set(completions[key] ?? []);
      const allDone = activeHabitIds.every((id) => done.has(id));
      samples++;
      if (!allDone) misses++;
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  if (samples < MIN_SAMPLES_FOR_PREDICTION) return null;
  return misses / samples;
}

export const habitflowReminderStrategy: ReminderStrategy = {
  productSlug: "habitflow",
  shouldRemind(rawData, now) {
    const data = rawData as HabitFlowReminderData;
    const activeHabits = (data.habits ?? []).filter((h) => !h.archivedAt);
    if (activeHabits.length === 0) return null;

    const completions = data.completions ?? {};
    const activeIds = activeHabits.map((h) => h.id);
    const todayKey = dateKey(now);
    const doneToday = new Set(completions[todayKey] ?? []);
    if (activeIds.every((id) => doneToday.has(id))) return null;

    // No baseline to judge idleness from if they've genuinely never checked
    // in -- treat as maximally idle rather than skipping the reminder.
    const idleMs = data.lastCheckInAt ? now.getTime() - new Date(data.lastCheckInAt).getTime() : Infinity;

    const missRate = dayOfWeekMissRate(completions, activeIds, now.getDay(), now);
    const isHighRiskDay = missRate !== null && missRate >= HIGH_MISS_RATE_THRESHOLD;
    const idleHours = isHighRiskDay ? PREDICTIVE_IDLE_HOURS : DEFAULT_IDLE_HOURS;
    if (idleMs < idleHours * 60 * 60 * 1000) return null;

    return {
      title: "Don't break the streak \u{1F525}",
      body: isHighRiskDay
        ? "Days like today tend to be tricky for you -- a quick check-in now keeps things going."
        : "You haven't checked in today -- no rush, just a nudge.",
      url: "/",
    };
  },
};
