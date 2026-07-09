import type { CompletionsByDate, RecoveryUsage } from "./types";

const COMPLETIONS_RETENTION_DAYS = 90;
const RECOVERIES_RETENTION_DAYS = 60;
const RECOVERY_WINDOW_DAYS = 7;

// Local calendar date, NOT toISOString().slice(0,10) -- that's UTC-based,
// while startOfDay()/addDays() below operate in local time. For any
// positive-UTC-offset timezone (e.g. Europe/Kiev, UTC+3), a local-midnight
// Date serializes via toISOString() to the *previous* UTC day, silently
// shifting every streak/grid/retention calculation back by one day. Local
// getters (getFullYear/getMonth/getDate) match the user's own calendar day
// regardless of UTC offset.
export function dateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function computeStreakEndingOn(habitId: string, completions: CompletionsByDate, endDate: Date): number {
  const isDoneOn = (key: string) => (completions[key] ?? []).includes(habitId);
  const cursor = new Date(endDate);
  let streak = 0;
  while (isDoneOn(dateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// Backward-walk-until-a-gap, same algorithm v1 used (kept -- it's bounded
// by the streak length itself, not a full history rescan, so it's already
// cheap). Computed on demand, never stored, to avoid the exact
// stored-value staleness bug Unstuck Daily already got bitten by once.
export function computeStreak(habitId: string, completions: CompletionsByDate, now: Date = new Date()): number {
  const today = startOfDay(now);
  const todayKey = dateKey(today);
  const isDoneOn = (key: string) => (completions[key] ?? []).includes(habitId);

  // Today not being checked off yet doesn't break an existing streak until
  // the day fully passes -- start counting from yesterday in that case.
  const endDate = isDoneOn(todayKey) ? today : addDays(today, -1);
  return computeStreakEndingOn(habitId, completions, endDate);
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

// True when: today isn't checked off yet, yesterday was missed (a real
// gap), and there was a genuine streak going into that gap -- i.e. the
// streak is about to reset to 0 unless the user does something today.
export function isRecoveryEligible(habitId: string, completions: CompletionsByDate, now: Date = new Date()): boolean {
  const today = startOfDay(now);
  const isDoneOn = (key: string) => (completions[key] ?? []).includes(habitId);
  if (isDoneOn(dateKey(today))) return false;

  const yesterday = addDays(today, -1);
  if (isDoneOn(dateKey(yesterday))) return false;

  const priorStreak = computeStreakEndingOn(habitId, completions, addDays(yesterday, -1));
  return priorStreak > 0;
}

export function updateLongestStreak(
  longest: Record<string, number>,
  habitId: string,
  currentStreak: number
): Record<string, number> {
  if ((longest[habitId] ?? 0) >= currentStreak) return longest;
  return { ...longest, [habitId]: currentStreak };
}

export function hasRecentRecovery(habitId: string, recoveries: RecoveryUsage[], now: Date = new Date()): boolean {
  const windowStart = now.getTime() - RECOVERY_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return recoveries.some((r) => r.habitId === habitId && new Date(r.usedAt).getTime() > windowStart);
}

// Rolling retention -- pruned client-side on every write so the AppUserData
// blob doesn't grow forever, unlike v1's unbounded completions array.
export function pruneCompletions(completions: CompletionsByDate, now: Date = new Date()): CompletionsByDate {
  const cutoffKey = dateKey(addDays(now, -COMPLETIONS_RETENTION_DAYS));
  const result: CompletionsByDate = {};
  for (const [key, ids] of Object.entries(completions)) {
    if (key >= cutoffKey) result[key] = ids;
  }
  return result;
}

export function pruneRecoveries(recoveries: RecoveryUsage[], now: Date = new Date()): RecoveryUsage[] {
  const cutoff = addDays(now, -RECOVERIES_RETENTION_DAYS).getTime();
  return recoveries.filter((r) => new Date(r.usedAt).getTime() >= cutoff);
}

// Sunday-start calendar week containing `now` -- 7 dates, Sun..Sat.
export function currentWeekDates(now: Date = new Date()): Date[] {
  const today = startOfDay(now);
  const sunday = addDays(today, -today.getDay());
  return Array.from({ length: 7 }, (_, i) => addDays(sunday, i));
}

// Count of the last `days` days (including today) this habit was checked
// off -- used to build the compact summary sent to the AI coach.
export function countRecentCompletions(
  habitId: string,
  completions: CompletionsByDate,
  days = 7,
  now: Date = new Date()
): number {
  const today = startOfDay(now);
  let count = 0;
  for (let i = 0; i < days; i++) {
    if ((completions[dateKey(addDays(today, -i))] ?? []).includes(habitId)) count++;
  }
  return count;
}
