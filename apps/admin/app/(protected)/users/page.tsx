"use client";

import { useEffect, useState } from "react";
import { Button, Card } from "@unstucklabs/ui";
import type { AdminUserSummary } from "@unstucklabs/sdk";
import { useAuth } from "../../../lib/auth-context";
import { getApiClient } from "../../../lib/api";

const ALL_ROLES: Array<"OWNER" | "EDITOR" | "SUPPORT"> = ["OWNER", "EDITOR", "SUPPORT"];

export default function UsersPage() {
  const { accessToken, user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUserSummary[] | null>(null);

  const isOwner = currentUser?.roles?.includes("OWNER");

  async function refresh() {
    if (!accessToken) return;
    const { users } = await getApiClient(accessToken).users.admin.list();
    setUsers(users);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function grantRole(id: string, role: "OWNER" | "EDITOR" | "SUPPORT") {
    if (!accessToken) return;
    await getApiClient(accessToken).users.admin.grantRole(id, role);
    await refresh();
  }

  async function revokeRole(id: string, role: "OWNER" | "EDITOR" | "SUPPORT") {
    if (!accessToken) return;
    await getApiClient(accessToken).users.admin.revokeRole(id, role);
    await refresh();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Users</h1>

      <div className="mt-6 space-y-3">
        {users === null ? (
          <p className="text-foreground/70">Loading…</p>
        ) : (
          users.map((user) => {
            const roles = user.memberships.map((m) => m.role);
            return (
              <Card key={user.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{user.email}</p>
                    <p className="text-sm text-foreground/70">
                      {user._count.subscriptions} subscription(s) · joined{" "}
                      {new Date(user.createdAt).toLocaleDateString("en-US")}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {roles.length === 0 ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground/60">
                        No role
                      </span>
                    ) : (
                      roles.map((role) => (
                        <span
                          key={role}
                          className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                        >
                          {role}
                        </span>
                      ))
                    )}
                  </div>
                </div>
                {isOwner && (
                  <div className="mt-3 flex gap-2 border-t border-border pt-3">
                    {ALL_ROLES.map((role) =>
                      roles.includes(role) ? (
                        <Button key={role} variant="secondary" onClick={() => revokeRole(user.id, role)}>
                          Revoke {role}
                        </Button>
                      ) : (
                        <Button key={role} variant="secondary" onClick={() => grantRole(user.id, role)}>
                          Grant {role}
                        </Button>
                      )
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
