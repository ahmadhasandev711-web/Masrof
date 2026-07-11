"use client";

import { useEffect } from "react";

const SW_MIGRATION_KEY = "masrofaty_sw_migration_v4";

/**
 * One-time cleanup for broken SW caches on production, then register the fixed worker.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const migrated = localStorage.getItem(SW_MIGRATION_KEY);

    async function registerWorker() {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await registration.update();
      } catch {
        // PWA optional — ignore registration failures
      }
    }

    if (migrated === SW_MIGRATION_KEY) {
      void registerWorker();
      return;
    }

    void navigator.serviceWorker.getRegistrations().then(async (registrations) => {
      if (registrations.length > 0) {
        await Promise.all(registrations.map((registration) => registration.unregister()));
        localStorage.setItem(SW_MIGRATION_KEY, SW_MIGRATION_KEY);
        window.location.reload();
        return;
      }

      localStorage.setItem(SW_MIGRATION_KEY, SW_MIGRATION_KEY);
      await registerWorker();
    });
  }, []);

  return null;
}
