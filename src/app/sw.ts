import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";
import { NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const PRIVATE_ROUTE_PREFIXES = [
  "/dashboard",
  "/admin",
  "/onboarding",
  "/invite",
  "/print",
] as const;

const PRIVATE_EXACT = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
]);

function isPrivateAppRoute(pathname: string): boolean {
  return (
    PRIVATE_EXACT.has(pathname) ||
    PRIVATE_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

/** Auth and workspace pages must always hit the network — never cache in SW. */
const privateAppNetworkOnly: RuntimeCaching = {
  matcher: ({ url: { pathname }, sameOrigin }) =>
    sameOrigin && isPrivateAppRoute(pathname),
  handler: new NetworkOnly(),
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  // Navigation preload can race with authenticated App Router pages on mobile PWA.
  navigationPreload: false,
  runtimeCaching: [privateAppNetworkOnly, ...defaultCache],
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
    self.registration.showNotification(data.title ?? "مصروفاتي", {
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
