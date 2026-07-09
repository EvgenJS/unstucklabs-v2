import { apiRequest, type ApiClientConfig } from "../client";

export interface HabitCoachInputHabit {
  name: string;
  streak: number;
  last7DaysCompleted: number;
}

export interface HabitCoachResult {
  consistencyScore: number;
  encouragement: string;
  insights: Array<{ type: "success" | "warning" | "tip"; text: string }>;
}

export interface RecoveryDaySuggestion {
  suggestion: string;
  rationale: string;
}

// HabitFlow-specific AI endpoints (coach + recovery-day). Habit/streak/
// completion state itself goes through the generic `appUserData` module.
export function createHabitFlowModule(config: ApiClientConfig) {
  return {
    ai: {
      coach(habits: HabitCoachInputHabit[]) {
        return apiRequest<HabitCoachResult>(config, "/apps/habitflow/ai/coach", {
          method: "POST",
          body: JSON.stringify({ habits }),
        });
      },

      recoveryDay(habitId: string, habitName: string) {
        return apiRequest<RecoveryDaySuggestion>(config, "/apps/habitflow/ai/recovery-day", {
          method: "POST",
          body: JSON.stringify({ habitId, habitName }),
        });
      },
    },
  };
}
