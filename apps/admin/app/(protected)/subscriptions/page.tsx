"use client";

import { useEffect, useState } from "react";
import { Card } from "@unstucklabs/ui";
import type { Subscription } from "@unstucklabs/sdk";
import { useAuth } from "../../../lib/auth-context";
import { getApiClient } from "../../../lib/api";

const STATUSES: Subscription["status"][] = ["ACTIVE", "CANCELED", "PAST_DUE", "EXPIRED", "TRIALING"];

export default function SubscriptionsPage() {
  const { accessToken, user: currentUser } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[] | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const canOverride = currentUser?.roles?.some((r) => r === "OWNER" || r === "EDITOR");

  async function refresh() {
    if (!accessToken) return;
    const { subscriptions } = await getApiClient(accessToken).subscriptions.admin.list(
      statusFilter ? { status: statusFilter } : {}
    );
    setSubscriptions(subscriptions);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, statusFilter]);

  async function updateStatus(id: string, status: Subscription["status"]) {
    if (!accessToken) return;
    await getApiClient(accessToken).subscriptions.admin.updateStatus(id, status);
    await refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Subscriptions</h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 space-y-3">
        {subscriptions === null ? (
          <p className="text-foreground/70">Loading…</p>
        ) : subscriptions.length === 0 ? (
          <p className="text-foreground/70">No subscriptions match this filter.</p>
        ) : (
          subscriptions.map((sub) => (
            <Card key={sub.id} className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">{sub.user?.email}</p>
                <p className="text-sm text-foreground/70">
                  {sub.product.name} · {sub.status}
                </p>
              </div>
              {canOverride && (
                <select
                  value={sub.status}
                  onChange={(e) => updateStatus(sub.id, e.target.value as Subscription["status"])}
                  className="rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
