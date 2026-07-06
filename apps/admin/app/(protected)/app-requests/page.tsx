"use client";

import { useEffect, useState } from "react";
import { Card } from "@unstucklabs/ui";
import type { AppRequest } from "@unstucklabs/sdk";
import { useAuth } from "../../../lib/auth-context";
import { getApiClient } from "../../../lib/api";

export default function AppRequestsPage() {
  const { accessToken } = useAuth();
  const [requests, setRequests] = useState<AppRequest[] | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    getApiClient(accessToken).appRequests.admin.list().then(({ appRequests }) => setRequests(appRequests));
  }, [accessToken]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">App Requests</h1>
      <p className="mt-2 text-sm text-foreground/70">
        Submissions from the landing page&apos;s &quot;help shape what we build next&quot; section.
      </p>

      <div className="mt-6 space-y-3">
        {requests === null ? (
          <p className="text-foreground/70">Loading…</p>
        ) : requests.length === 0 ? (
          <p className="text-foreground/70">No submissions yet.</p>
        ) : (
          requests.map((req) => (
            <Card key={req.id}>
              <p className="font-semibold text-foreground">{req.email}</p>
              <p className="mt-1 text-sm text-foreground/70">{req.description}</p>
              <p className="mt-2 text-xs text-foreground/50">
                {new Date(req.createdAt).toLocaleString("en-US")}
              </p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
