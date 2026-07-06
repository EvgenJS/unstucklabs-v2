import { apiRequest, type ApiClientConfig } from "../client";
import type { ContactMessage } from "../types";

export function createContactModule(config: ApiClientConfig) {
  return {
    send(email: string, message: string) {
      return apiRequest<{ message: { id: string } }>(config, "/contact", {
        method: "POST",
        body: JSON.stringify({ email, message }),
      });
    },

    admin: {
      list() {
        return apiRequest<{ messages: ContactMessage[] }>(config, "/admin/contact-messages");
      },
    },
  };
}
