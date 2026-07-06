import { apiRequest, type ApiClientConfig } from "../client";
import type { Subscription } from "../types";

export function createSubscriptionsModule(config: ApiClientConfig) {
  return {
    mine() {
      return apiRequest<{ subscriptions: Subscription[] }>(config, "/me/subscriptions");
    },
  };
}
