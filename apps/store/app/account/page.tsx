"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@unstucklabs/ui";
import type { Subscription } from "@unstucklabs/sdk";
import { useAuth } from "../../lib/auth-context";
import { getApiClient } from "../../lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function launchUrl(subdomain: string | null) {
  if (!subdomain) return null;
  // Mini-apps aren't deployed yet (Phase 4+) -- this constructs the intended
  // production URL shape so the link is correct once they exist.
  return `https://${subdomain}.unstucklabs.store`;
}

export default function AccountPage() {
  const { user, accessToken, loading, logout } = useAuth();
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[] | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/account");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user && accessToken) {
      getApiClient(accessToken)
        .subscriptions.mine()
        .then((res) => setSubscriptions(res.subscriptions))
        .catch(() => setSubscriptions([]));
    }
  }, [user, accessToken]);

  if (loading || !user) return null;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">My account</h1>
        <Button
          variant="secondary"
          onClick={async () => {
            await logout();
            router.push("/");
          }}
        >
          Log out
        </Button>
      </div>
      <p className="mt-2 text-foreground/70">{user.email}</p>

      <h2 className="mt-10 text-lg font-semibold text-foreground">My subscriptions</h2>

      {subscriptions === null ? (
        <p className="mt-4 text-foreground/70">Loading…</p>
      ) : subscriptions.length === 0 ? (
        <p className="mt-4 text-foreground/70">
          No subscriptions yet — <a href="/apps" className="font-semibold text-primary">browse the apps</a> to get started.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {subscriptions.map((sub) => {
            const url = launchUrl(sub.product.subdomain);
            const cover = sub.product.media?.find((item) => item.type === "IMAGE");
            return (
              <Card key={sub.id} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {cover && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`${API_URL}${cover.url}`}
                      alt={`${sub.product.name} cover`}
                      className="h-14 w-20 shrink-0 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-foreground">{sub.product.name}</p>
                    <p className="text-sm text-foreground/70">{sub.status}</p>
                  </div>
                </div>
                {url && sub.status === "ACTIVE" && (
                  <a
                    href={url}
                    className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-accent px-6 py-3 font-semibold text-on-primary transition duration-200 ease-out hover:-translate-y-0.5 hover:opacity-90"
                  >
                    Launch
                  </a>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
