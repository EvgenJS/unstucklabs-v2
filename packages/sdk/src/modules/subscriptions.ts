import { apiRequest, type ApiClientConfig } from "../client";
import type { Subscription } from "../types";

export function createSubscriptionsModule(config: ApiClientConfig) {
  return {
    mine() {
      return apiRequest<{ subscriptions: Subscription[] }>(config, "/me/subscriptions");
    },

    // Generic, product-agnostic free-trial start -- 409s server-side if the
    // caller already has (or has ever had) a Subscription row for this
    // product, so this is safe to call speculatively from a "start trial"
    // button without a separate client-side "have I trialed" check.
    startTrial(productSlug: string) {
      return apiRequest<{ subscription: Subscription }>(config, `/apps/${productSlug}/trial/start`, {
        method: "POST",
      });
    },

    admin: {
      list(filters: { userId?: string; productId?: string; status?: string } = {}) {
        const query = new URLSearchParams();
        if (filters.userId) query.set("userId", filters.userId);
        if (filters.productId) query.set("productId", filters.productId);
        if (filters.status) query.set("status", filters.status);
        const qs = query.toString();

        return apiRequest<{ subscriptions: Subscription[] }>(
          config,
          `/admin/subscriptions${qs ? `?${qs}` : ""}`
        );
      },

      updateStatus(id: string, status: Subscription["status"]) {
        return apiRequest<{ subscription: Subscription }>(config, `/admin/subscriptions/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        });
      },
    },
  };
}
