import { apiRequest, type ApiClientConfig } from "../client";

export interface TaskBreakdown {
  subtasks: string[];
  estimateMinutes: number;
  encouragement: string;
}

export interface Resource {
  title: string;
  url: string;
}

// Unstuck-Daily-specific AI endpoints (task breakdown + resource search).
// Push subscribe/unsubscribe live in the generic `push` module instead
// (parameterized by productSlug), since core-api's push routes have no
// product-specific logic. Everything else the mini-app needs (its own
// task/session/history state) goes through the generic `appUserData`
// module.
export function createUnstuckDailyModule(config: ApiClientConfig) {
  return {
    ai: {
      splitTask(taskTitle: string, brainDump?: string) {
        return apiRequest<TaskBreakdown>(config, "/apps/unstuck-daily/ai/split-task", {
          method: "POST",
          body: JSON.stringify({ taskTitle, brainDump }),
        });
      },

      findResources(subtaskTitle: string, taskTitle?: string) {
        return apiRequest<{ resources: Resource[] }>(config, "/apps/unstuck-daily/ai/find-resources", {
          method: "POST",
          body: JSON.stringify({ subtaskTitle, taskTitle }),
        });
      },
    },
  };
}
