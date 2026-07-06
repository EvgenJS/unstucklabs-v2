import { apiRequest, type ApiClientConfig } from "../client";
import type { AdminUserSummary, AdminUserDetail } from "../types";

export function createUsersModule(config: ApiClientConfig) {
  return {
    admin: {
      list() {
        return apiRequest<{ users: AdminUserSummary[] }>(config, "/admin/users");
      },

      get(id: string) {
        return apiRequest<{ user: AdminUserDetail }>(config, `/admin/users/${id}`);
      },

      grantRole(id: string, role: "OWNER" | "EDITOR" | "SUPPORT") {
        return apiRequest<{ membership: unknown }>(config, `/admin/users/${id}/memberships`, {
          method: "POST",
          body: JSON.stringify({ role }),
        });
      },

      revokeRole(id: string, role: "OWNER" | "EDITOR" | "SUPPORT") {
        return apiRequest<void>(config, `/admin/users/${id}/memberships/${role}`, { method: "DELETE" });
      },
    },
  };
}
