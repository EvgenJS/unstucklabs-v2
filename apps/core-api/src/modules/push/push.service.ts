import webpush from "web-push";
import type { PrismaClient } from "@prisma/client";

// Thin wrapper around the `web-push` package so nothing else in the app
// imports it directly. Without VAPID keys configured (e.g. local dev before
// `npx web-push generate-vapid-keys` has been run), sends are logged and
// skipped rather than throwing -- mirrors email.service.ts's pattern for
// RESEND_API_KEY.
let configured = false;

function ensureConfigured(): boolean {
  if (configured) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:hello@unstucklabs.com";
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
}

export function createPushService(prisma: PrismaClient) {
  return {
    async send(subscription: { id: string; endpoint: string; p256dh: string; auth: string }, payload: PushPayload) {
      if (!ensureConfigured()) {
        console.warn("[push] VAPID keys not set, skipping send to", subscription.endpoint);
        return;
      }

      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          JSON.stringify({
            title: payload.title,
            body: payload.body,
            icon: payload.icon ?? "/icons/icon-192.png",
            url: payload.url ?? "/",
          })
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Subscription is gone (browser unsubscribed, uninstalled, etc.) --
          // standard Push API hygiene is to drop it rather than retry forever.
          await prisma.pushSubscription.delete({ where: { id: subscription.id } }).catch(() => {});
        } else {
          throw err;
        }
      }
    },
  };
}
