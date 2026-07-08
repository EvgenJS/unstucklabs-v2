import type { CurrentTask, UnstuckDailyData } from "./types";

export interface AchievementDef {
  id: string;
  label: string;
  description: string;
}

// Lifetime cumulative milestones only -- deliberately NOT streaks. The
// product brief is explicit: "no streaks, no shame, no pressure." A
// consecutive-day counter would directly contradict that, so gamification
// here rewards cumulative progress and even celebrates returning after a
// break ("Comeback") instead of penalizing the gap. Badges are additive and
// never regress once unlocked.
export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first-step", label: "First step", description: "Completed your very first subtask." },
  { id: "getting-started", label: "Getting started", description: "Finished your first whole task." },
  { id: "momentum", label: "Momentum", description: "Completed 5 tasks." },
  { id: "deep-focus", label: "Deep focus", description: "Broke a task into 8+ steps and finished every one." },
  { id: "century-club", label: "Century club", description: "Completed 100 subtasks, lifetime." },
  { id: "comeback", label: "Comeback", description: "Came back and finished a task after a week away." },
];

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Called right after a task is marked complete. `data` is the state BEFORE
// this completion is folded in (so "was this the user's Nth task" reads
// correctly), `completedTask` is the task that just finished.
export function checkNewAchievements(data: UnstuckDailyData, completedTask: CurrentTask, previousActivityAt: string): string[] {
  const alreadyUnlocked = new Set(data.achievements.unlocked.map((a) => a.id));
  const newlyUnlocked: string[] = [];

  const totalSubtasksAfter = data.achievements.stats.totalSubtasksCompleted + completedTask.subtasks.length;
  const totalTasksAfter = data.achievements.stats.totalTasksCompleted + 1;

  function unlock(id: string) {
    if (!alreadyUnlocked.has(id)) newlyUnlocked.push(id);
  }

  if (totalSubtasksAfter >= 1) unlock("first-step");
  if (totalTasksAfter >= 1) unlock("getting-started");
  if (totalTasksAfter >= 5) unlock("momentum");
  if (completedTask.subtasks.length >= 8) unlock("deep-focus");
  if (totalSubtasksAfter >= 100) unlock("century-club");

  const idleMs = Date.now() - new Date(previousActivityAt).getTime();
  if (idleMs >= SEVEN_DAYS_MS) unlock("comeback");

  return newlyUnlocked;
}
