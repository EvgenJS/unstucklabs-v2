import { apiRequest, type ApiClientConfig } from "../client";

export function createContactModule(config: ApiClientConfig) {
  return {
    send(email: string, message: string) {
      return apiRequest<{ message: { id: string } }>(config, "/contact", {
        method: "POST",
        body: JSON.stringify({ email, message }),
      });
    },
  };
}
