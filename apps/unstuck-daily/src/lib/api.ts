import { createApiClient } from "@unstucklabs/sdk";

export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
export const STORE_URL = import.meta.env.VITE_STORE_URL ?? "http://localhost:3000";
export const PRODUCT_SLUG = "unstuck-daily";

// One client factory for the whole app -- mirrors apps/store/lib/api.ts.
// Nothing else should hand-roll fetch() calls to core-api directly.
export function getApiClient(accessToken?: string) {
  return createApiClient({ baseUrl: API_URL, accessToken });
}
