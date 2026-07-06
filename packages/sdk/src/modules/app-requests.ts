import { apiRequest, type ApiClientConfig } from "../client";
import type { AppRequest } from "../types";

export function createAppRequestsModule(config: ApiClientConfig) {
  return {
    submit(email: string, description: string) {
      return apiRequest<{ appRequest: { id: string } }>(config, "/app-requests", {
        method: "POST",
        body: JSON.stringify({ email, description }),
      });
    },

    admin: {
      list() {
        return apiRequest<{ appRequests: AppRequest[] }>(config, "/admin/app-requests");
      },
    },
  };
}
