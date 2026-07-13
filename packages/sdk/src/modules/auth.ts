import { apiRequest, type ApiClientConfig } from "../client";
import type { User } from "../types";

export interface AuthResult {
  user: { id: string; email: string; createdAt: string };
  accessToken: string;
}

// register() no longer implies a session -- the address must be verified
// first (see docs/ROADMAP.md) -- so it gets its own result type instead of
// polluting AuthResult's accessToken with `| null` for login/refresh/
// verifyEmail, which always return a real token.
export interface RegisterResult {
  user: { id: string; email: string; createdAt: string };
  accessToken: string | null;
}

export function createAuthModule(config: ApiClientConfig) {
  return {
    register(email: string, password: string) {
      return apiRequest<RegisterResult>(config, "/auth/register", {
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

    verifyEmail(token: string) {
      return apiRequest<AuthResult>(config, `/auth/verify-email?token=${encodeURIComponent(token)}`);
    },

    resendVerification(email: string) {
      return apiRequest<{ message: string }>(config, "/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
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
