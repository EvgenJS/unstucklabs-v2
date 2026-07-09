import { useEffect, useState } from "react";
import { Button } from "@unstucklabs/ui";
import { useAuth } from "../lib/auth-context";
import { pushSupported, getExistingPushSubscription, subscribeToPush } from "../lib/push";

const DISMISS_KEY = "habitflow:push-banner-dismissed";

// Soft, dismissible ask -- never a blocking modal. If the browser doesn't
// support Push (Safari on older iOS, etc.) or the user already
// subscribed/dismissed it, this renders nothing.
export function PushPermissionBanner() {
  const { accessToken } = useAuth();
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<"idle" | "asking">("idle");

  useEffect(() => {
    if (!pushSupported()) return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    if (Notification.permission === "denied") return;
    getExistingPushSubscription().then((existing) => {
      if (!existing) setVisible(true);
    });
  }, []);

  if (!visible) return null;

  async function handleEnable() {
    setStatus("asking");
    try {
      await subscribeToPush(accessToken ?? undefined);
    } finally {
      setVisible(false);
      setStatus("idle");
    }
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  return (
    <div className="mx-auto mt-4 flex max-w-lg items-center justify-between gap-3 rounded-lg border border-border bg-white px-4 py-3 text-sm">
      <p className="text-muted-foreground">
        Want a gentle nudge if a day slips by unchecked? We'll only ping you about habits you're tracking, no more
        than once a day.
      </p>
      <div className="flex shrink-0 gap-2">
        <button type="button" onClick={handleDismiss} className="cursor-pointer text-muted-foreground hover:text-foreground">
          No thanks
        </button>
        <Button variant="secondary" onClick={handleEnable} disabled={status === "asking"}>
          Enable
        </Button>
      </div>
    </div>
  );
}
