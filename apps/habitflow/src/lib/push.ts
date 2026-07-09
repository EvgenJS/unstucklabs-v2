import { getApiClient, PRODUCT_SLUG } from "./api";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? "";

// Web Push subscription keys arrive base64url-encoded; the Push API needs
// them as a raw Uint8Array.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function pushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function getExistingPushSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function subscribeToPush(accessToken: string | undefined): Promise<void> {
  if (!pushSupported() || !VAPID_PUBLIC_KEY) return;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
  });

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) return;

  await getApiClient(accessToken).push.subscribe(PRODUCT_SLUG, {
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
  });
}
