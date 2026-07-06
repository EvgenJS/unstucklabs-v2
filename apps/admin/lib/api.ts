import { createApiClient } from "@unstucklabs/sdk";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function getApiClient(accessToken?: string) {
  return createApiClient({ baseUrl: API_URL, accessToken });
}
