"use client";

import { useEffect, useState } from "react";
import { Card, Button } from "@unstucklabs/ui";
import type { ManualPaymentRequest } from "@unstucklabs/sdk";
import { useAuth } from "../../../lib/auth-context";
import { getApiClient } from "../../../lib/api";

export default function ManualPaymentRequestsPage() {
  const { accessToken, user: currentUser } = useAuth();
  const [requests, setRequests] = useState<ManualPaymentRequest[] | null>(null);

  const canFulfill = currentUser?.roles?.some((r) => r === "OWNER" || r === "EDITOR");

  async function refresh() {
    if (!accessToken) return;
    const { manualPaymentRequests } = await getApiClient(accessToken).manualPayments.admin.list();
    setRequests(manualPaymentRequests);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function fulfill(id: string) {
    if (!accessToken) return;
    await getApiClient(accessToken).manualPayments.admin.fulfill(id);
    await refresh();
  }

  async function cancel(id: string) {
    if (!accessToken) return;
    await getApiClient(accessToken).manualPayments.admin.cancel(id);
    await refresh();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Manual Payment Requests</h1>
      <p className="mt-1 text-sm text-foreground/70">
        Payoneer &quot;Request a Payment&quot; flow -- create the invoice by hand outside this system, then mark
        Fulfilled once paid to activate the subscription.
      </p>

      <div className="mt-6 space-y-3">
        {requests === null ? (
          <p className="text-foreground/70">Loading…</p>
        ) : requests.length === 0 ? (
          <p className="text-foreground/70">No manual payment requests yet.</p>
        ) : (
          requests.map((req) => (
            <Card key={req.id} className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">{req.user?.email}</p>
                <p className="text-sm text-foreground/70">
                  {req.product?.name} · {req.billingPeriod} · {req.status}
                  {req.promoCode ? ` · promo: ${req.promoCode}` : ""}
                </p>
                <p className="mt-1 text-xs text-foreground/50">{new Date(req.createdAt).toLocaleString("en-US")}</p>
              </div>
              {canFulfill && req.status === "PENDING" && (
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => cancel(req.id)}>
                    Cancel
                  </Button>
                  <Button onClick={() => fulfill(req.id)}>Mark Fulfilled</Button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
