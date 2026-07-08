import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Button } from "@unstucklabs/ui";
import { useAuth } from "../lib/auth-context";
import { getApiClient, STORE_URL, PRODUCT_SLUG } from "../lib/api";

type AccessState = "checking" | "granted" | "no-account" | "no-subscription";

// UX-only gate -- checks subscriptions.mine() client-side for a fast,
// friendly redirect. The real enforcement is server-side: every core-api
// route this app calls (AppUserData, AI, push) independently runs
// requireProductAccess() and 403s a request from an unsubscribed user
// regardless of what this component decides. Same "don't trust the
// client" principle CLAUDE.md already applies to RBAC.
//
// Note: we can't send the user to Store's /login with a `redirect` back to
// this app's own origin -- Store's login page does `router.push(redirect)`
// via next/navigation, which only handles internal Store routes, not a
// cross-origin bounce back to this Vite app. So login/checkout happen in a
// separate tab; this component exposes a manual "recheck" instead of
// relying on a redirect carrying the session back (the httpOnly cookie is
// shared across ports already, so a recheck picks it up immediately).
export function SubscriptionGate({ children }: { children: ReactNode }) {
  const { user, accessToken, loading } = useAuth();
  const [access, setAccess] = useState<AccessState>("checking");
  const [recheckPending, setRecheckPending] = useState(false);

  const check = useCallback(() => {
    if (!user) {
      setAccess("no-account");
      return;
    }
    getApiClient(accessToken ?? undefined)
      .subscriptions.mine()
      .then(({ subscriptions }) => {
        const active = subscriptions.some(
          (sub) => sub.product.slug === PRODUCT_SLUG && (sub.status === "ACTIVE" || sub.status === "TRIALING")
        );
        setAccess(active ? "granted" : "no-subscription");
      })
      .catch(() => setAccess("no-subscription"));
  }, [user, accessToken]);

  useEffect(() => {
    if (loading) return;
    check();
  }, [loading, check]);

  async function handleRecheck() {
    setRecheckPending(true);
    // AuthProvider only refreshes on mount -- force a full reload so it
    // re-runs auth.refresh() against the (possibly now-set) cookie, then
    // the effect above re-checks subscription state.
    window.location.reload();
  }

  if (loading || access === "checking") {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-foreground/60">Loading…</p>
      </div>
    );
  }

  if (access === "no-account") {
    return (
      <GateScreen
        title="Let's get you started"
        body="Log in on the UnstuckLabs store in the tab that just opened, then come back here."
        ctaLabel="Log in on the store"
        ctaHref={`${STORE_URL}/login`}
        onRecheck={handleRecheck}
        recheckPending={recheckPending}
      />
    );
  }

  if (access === "no-subscription") {
    return (
      <GateScreen
        title="Unstuck Daily needs an active subscription"
        body="One task at a time, with an AI coach that actually breaks things down for you. Subscribe on the store, then come back here."
        ctaLabel="View pricing"
        ctaHref={`${STORE_URL}/apps/${PRODUCT_SLUG}`}
        onRecheck={handleRecheck}
        recheckPending={recheckPending}
      />
    );
  }

  return <>{children}</>;
}

function GateScreen({
  title,
  body,
  ctaLabel,
  ctaHref,
  onRecheck,
  recheckPending,
}: {
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  onRecheck: () => void;
  recheckPending: boolean;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      <p className="max-w-sm text-foreground/70">{body}</p>
      <div className="flex gap-3">
        <Button onClick={() => window.open(ctaHref, "_blank", "noopener")}>{ctaLabel}</Button>
        <Button variant="secondary" onClick={onRecheck} disabled={recheckPending}>
          I&apos;m back
        </Button>
      </div>
    </div>
  );
}
