import { apiRequest, type ApiClientConfig } from "../client";

export interface TaskBreakdown {
  subtasks: string[];
  estimateMinutes: number;
  encouragement: string;
}

export interface PushSubscriptionKeys {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface Resource {
  title: string;
  url: string;
}

// Unstuck-Daily-specific endpoints (AI task breakdown + push subscribe).
// Everything else the mini-app needs (its own task/session/history state)
// goes through the generic `appUserData` module instead.
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

    push: {
      subscribe(subscription: PushSubscriptionKeys) {
        return apiRequest<{ ok: true }>(config, "/apps/unstuck-daily/push/subscribe", {
          method: "POST",
          body: JSON.stringify(subscription),
        });
      },

      unsubscribe(endpoint: string) {
        return apiRequest<void>(config, "/apps/unstuck-daily/push/subscribe", {
          method: "DELETE",
          body: JSON.stringify({ endpoint }),
        });
      },
    },
  };
}
