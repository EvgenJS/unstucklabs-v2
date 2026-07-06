import { apiRequest, type ApiClientConfig } from "../client";
import type { User } from "../types";

export interface AuthResult {
  user: { id: string; email: string; createdAt: string };
  accessToken: string;
}

export function createAuthModule(config: ApiClientConfig) {
  return {
    register(email: string, password: string) {
      return apiRequest<AuthResult>(config, "/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    },

    login(email: string, password: string) {
      return apiRequest<AuthResult>(config, "/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    },

    refresh() {
      return apiRequest<AuthResult>(config, "/auth/refresh", { method: "POST" });
    },

    logout() {
      return apiRequest<void>(config, "/auth/logout", { method: "POST" });
    },

    me() {
      return apiRequest<User>(config, "/auth/me");
    },
  };
}
