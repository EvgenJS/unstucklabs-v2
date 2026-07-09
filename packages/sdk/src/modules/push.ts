import { apiRequest, type ApiClientConfig } from "../client";

export interface PushSubscriptionKeys {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

// Generic push subscribe/unsubscribe -- parameterized by productSlug like
// app-user-data.ts, since core-api's push routes have no product-specific
// logic (unlike each app's own AI routes). Reused by every mini-app instead
// of each getting its own duplicate module.
export function createPushModule(config: ApiClientConfig) {
  return {
    subscribe(productSlug: string, subscription: PushSubscriptionKeys) {
      return apiRequest<{ ok: true }>(config, `/apps/${productSlug}/push/subscribe`, {
        method: "POST",
        body: JSON.stringify(subscription),
      });
    },

    unsubscribe(productSlug: string, endpoint: string) {
      return apiRequest<void>(config, `/apps/${productSlug}/push/subscribe`, {
        method: "DELETE",
        body: JSON.stringify({ endpoint }),
      });
    },
  };
}
