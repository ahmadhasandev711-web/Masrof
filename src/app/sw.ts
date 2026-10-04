import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";
import { CacheFirst, ExpirationPlugin, NetworkOnly, Serwist, StaleWhileRevalidate } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * Cache only immutable static assets.
 * Do NOT cache HTML/RSC/navigation — authenticated App Router pages break when
 * the service worker intercepts document requests (no-response / layout glitches).
 */
const staticRuntimeCaching: RuntimeCaching[] = [
  {
    matcher: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
    handler: new CacheFirst({
      cacheName: "google-fonts-webfonts",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60,
        }),
      ],
    }),
  },
  {
    matcher: /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
    handler: new StaleWhileRevalidate({
      cacheName: "google-fonts-stylesheets",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 4,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        }),
      ],
    }),
  },
  {
    matcher: /\/_next\/static.+\.(?:js|css)$/i,
    handler: new CacheFirst({
      cacheName: "next-static-assets",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 64,
          maxAgeSeconds: 365 * 24 * 60 * 60,
        }),
      ],
    }),
  },
  {
    matcher: /\/icons\/.+\.(?:png|ico|svg|webp)$/i,
    handler: new CacheFirst({
      cacheName: "pwa-icons",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 8,
          maxAgeSeconds: 30 * 24 * 60 * 60,
        }),
      ],
    }),
  },
  {
    matcher: /\/api\/auth\/.*/i,
    handler: new NetworkOnly(),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching: staticRuntimeCaching,
});

serwist.addEventListeners();

self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json() as {
    title?: string;
    body?: string;
    icon?: string;
    badge?: string;
    url?: string;
  };

  event.waitUntil(
    self.registration.showNotification(data.title ?? "سندات", {
      body: data.body,
      icon: data.icon ?? "/icons/icon-192.png",
      badge: data.badge ?? "/icons/icon-192.png",
      data: { url: data.url ?? "/dashboard" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string } | undefined)?.url ?? "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
