import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Button } from "@unstucklabs/ui";
import { useAuth } from "../lib/auth-context";
import { getApiClient, STORE_URL, PRODUCT_SLUG } from "../lib/api";

type AccessState = "checking" | "granted" | "no-account" | "trial-available" | "no-subscription";

// UX-only gate -- checks subscriptions.mine() client-side for a fast,
// friendly redirect. The real enforcement is server-side: every core-api
// route this app calls (AppUserData, AI, push) independently runs
// requireProductAccess() and 403s a request from an unsubscribed user
// regardless of what this component decides. Same "don't trust the
// client" principle CLAUDE.md already applies to RBAC. Mirrors
// apps/habitflow/src/components/SubscriptionGate.tsx's `trial-available`
// state -- Unstuck Daily originally shipped with no free tier at all, but
// picked up the same 5-day full-access trial mechanism the product-agnostic
// `POST /apps/:productSlug/trial/start` endpoint was already built to
// support (see docs/ROADMAP.md Change Log).
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
        const sub = subscriptions.find((s) => s.product.slug === PRODUCT_SLUG);
        if (!sub) {
          // No Subscription row at all for this product yet -- the trial
          // hasn't been used. POST /trial/start independently re-derives
          // and 409s on a second attempt, so this client-side read being
          // stale can never actually grant a second trial.
          setAccess("trial-available");
          return;
        }
        const active = sub.status === "ACTIVE" || sub.status === "TRIALING";
        setAccess(active ? "granted" : "no-subscription");
      })
      .catch(() => setAccess("no-subscription"));
  }, [user, accessToken]);

  useEffect(() => {
    if (loading) return;
    check();
  }, [loading, check]);

  // AuthProvider only refreshes on mount -- force a full reload so it
  // re-runs auth.refresh() against the (possibly now-set) cookie, then the
  // effect above re-checks subscription state. Also used after a
  // successful trial start, for the same reason.
  function handleRecheck() {
    setRecheckPending(true);
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

  if (access === "trial-available") {
    return <TrialScreen accessToken={accessToken ?? undefined} onStarted={handleRecheck} pending={recheckPending} />;
  }

  if (access === "no-subscription") {
    return (
      <GateScreen
        title="Unstuck Daily needs an active subscription"
        body="Your free trial has ended. Subscribe on the store to keep breaking tasks down, then come back here."
        ctaLabel="View pricing"
        ctaHref={`${STORE_URL}/apps/${PRODUCT_SLUG}`}
        onRecheck={handleRecheck}
        recheckPending={recheckPending}
      />
    );
  }

  return <>{children}</>;
}

function TrialScreen({
  accessToken,
  onStarted,
  pending,
}: {
  accessToken: string | undefined;
  onStarted: () => void;
  pending: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "starting" | "error">("idle");

  async function handleStart() {
    setStatus("starting");
    try {
      await getApiClient(accessToken).subscriptions.startTrial(PRODUCT_SLUG);
      onStarted();
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold text-foreground">Starting is the hard part</h1>
      <p className="max-w-sm text-foreground/70">
        Start your 5 days free -- full access, no card needed. AI task breakdown, the focus timer, everything,
        unlocked from day one.
      </p>
      <Button onClick={handleStart} disabled={status === "starting" || pending}>
        {status === "starting" ? "Starting…" : "Start your 5 days free"}
      </Button>
      {status === "error" && (
        <p className="text-sm text-destructive">Something went wrong -- try again in a moment.</p>
      )}
    </div>
  );
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
