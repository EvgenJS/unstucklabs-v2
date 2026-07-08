/// <reference lib="webworker" />
import { precacheAndRoute } from "workbox-precaching";

declare let self: ServiceWorkerGlobalScope;

// App-shell precache only -- core-api lives on a different origin, so API
// requests (auth/AI/data) are never intercepted by this service worker.
precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("push", (event: PushEvent) => {
  const data = event.data?.json() as { title?: string; body?: string; icon?: string; url?: string } | undefined;
  const title = data?.title ?? "Unstuck Daily";

  event.waitUntil(
    self.registration.showNotification(title, {
      body: data?.body,
      icon: data?.icon ?? "/icons/icon-192.png",
      data: { url: data?.url ?? "/" },
    })
  );
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string } | undefined)?.url ?? "/";
  event.waitUntil(self.clients.openWindow(url));
});
