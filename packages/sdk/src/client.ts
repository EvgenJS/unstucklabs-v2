export interface ApiClientConfig {
  /** e.g. "http://localhost:3001" in dev, "https://api.unstucklabs.com" in prod. */
  baseUrl: string;
  /** Bearer access token, when calling on behalf of an authenticated user. */
  accessToken?: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown
  ) {
    super(`API request failed with status ${status}`);
  }
}

// `credentials: "include"` is required so the httpOnly refresh cookie
// (scoped to the parent domain for cross-subdomain SSO, see core-api's
// lib/refresh-cookie.ts) is sent/received on cross-origin requests from the
// Store or any mini-app to core-api.
export async function apiRequest<T>(
  config: ApiClientConfig,
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) {
    headers.set("Content-Type", "application/json");
  }
  if (config.accessToken) {
    headers.set("Authorization", `Bearer ${config.accessToken}`);
  }

  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.json().catch(() => undefined);

  if (!response.ok) {
    throw new ApiError(response.status, body);
  }

  return body as T;
}
