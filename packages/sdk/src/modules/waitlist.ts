import { apiRequest, type ApiClientConfig } from "../client";

export function createWaitlistModule(config: ApiClientConfig) {
  return {
    subscribe(email: string, source?: string) {
      return apiRequest<{ subscriber: { id: string; email: string } }>(config, "/waitlist", {
        method: "POST",
        body: JSON.stringify({ email, source }),
      });
    },
  };
}
