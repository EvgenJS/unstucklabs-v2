import type { ReminderStrategy } from "../push/reminder-strategy.types.js";

interface UnstuckDailyCurrentTask {
  title: string;
  status: "active" | "completed" | "abandoned";
}

interface UnstuckDailyData {
  currentTask?: UnstuckDailyCurrentTask | null;
  lastActivityAt?: string;
}

// "4h idle mid-task" is a different concept from HabitFlow's "haven't
// checked in today" -- each strategy owns its own threshold semantics
// rather than sharing one global env var.
const THRESHOLD_HOURS = Number(process.env.PUSH_REMINDER_THRESHOLD_HOURS ?? 4);

export const unstuckDailyReminderStrategy: ReminderStrategy = {
  productSlug: "unstuck-daily",
  shouldRemind(rawData, now) {
    const data = rawData as UnstuckDailyData;
    const task = data.currentTask;
    if (!task || task.status !== "active" || !data.lastActivityAt) return null;

    const idleMs = now.getTime() - new Date(data.lastActivityAt).getTime();
    if (idleMs < THRESHOLD_HOURS * 60 * 60 * 1000) return null;

    return {
      title: "Still there? \u{1F44B}",
      body: `Your task "${task.title}" is right where you left it — no rush.`,
      url: "/",
    };
  },
};
