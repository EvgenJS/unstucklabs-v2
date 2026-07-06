import { createApiClient } from "@unstucklabs/sdk";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// One client factory for the whole Store app -- server components call this
// with no token for public reads; client components pass along the access
// token held in memory/state after login. Nothing else should hand-roll
// fetch() calls to core-api directly.
export function getApiClient(accessToken?: string) {
  return createApiClient({ baseUrl: API_URL, accessToken });
}
