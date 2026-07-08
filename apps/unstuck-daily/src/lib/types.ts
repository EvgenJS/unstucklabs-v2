export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  completedAt: string | null;
}

export interface CurrentTask {
  id: string;
  title: string;
  brainDump?: string;
  createdAt: string;
  aiEstimateMinutes: number | null;
  encouragement: string | null;
  subtasks: Subtask[];
  status: "active" | "completed" | "abandoned";
}

export interface HistoryEntry {
  taskId: string;
  title: string;
  completedAt: string;
  totalSubtasks: number;
  completedSubtasks: number;
  aiEstimateMinutes: number | null;
  actualMinutes: number | null;
}

export interface Achievement {
  id: string;
  unlockedAt: string;
}

export interface UnstuckDailyData {
  version: 1;
  currentTask: CurrentTask | null;
  history: HistoryEntry[];
  achievements: {
    unlocked: Achievement[];
    stats: { totalTasksCompleted: number; totalSubtasksCompleted: number };
  };
  aiUsage: { date: string; callsToday: number };
  lastActivityAt: string;
}

export function emptyData(): UnstuckDailyData {
  return {
    version: 1,
    currentTask: null,
    history: [],
    achievements: { unlocked: [], stats: { totalTasksCompleted: 0, totalSubtasksCompleted: 0 } },
    aiUsage: { date: new Date().toISOString().slice(0, 10), callsToday: 0 },
    lastActivityAt: new Date().toISOString(),
  };
}
