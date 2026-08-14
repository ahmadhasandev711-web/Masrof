"use client";

import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import {
  sendTestPushAction,
  subscribeToPushAction,
  unsubscribeFromPushAction,
} from "@/features/push/actions";
import { useTranslations } from "next-intl";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

function isSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/** Push support never changes for the lifetime of the page, so there is nothing to subscribe to. */
function subscribeToNothing() {
  return () => {};
}

export function PushNotificationSettings({
  canUsePush,
  vapidPublicKey,
  initialSubscriptionCount,
}: {
  canUsePush: boolean;
  vapidPublicKey: string | null;
  initialSubscriptionCount: number;
}) {
  const tPush = useTranslations("dashboard.push");
  const tErrors = useTranslations("errors");
  const supported = useSyncExternalStore(
    subscribeToNothing,
    isSupported,
    () => false,
  );
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionCount, setSubscriptionCount] = useState(initialSubscriptionCount);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isSupported()) return;

    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then(setSubscription)
      .catch(() => setSubscription(null));
  }, []);

  async function ensureServiceWorker() {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });
    return registration;
  }

  function handleSubscribe() {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      if (!canUsePush) {
        setError(tPush("planRequired"));
        return;
      }

      if (!vapidPublicKey) {
        setError(tErrors("vapidMissing"));
        return;
      }

      if (!supported) {
        setError(tErrors("pushUnsupported"));
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError(tErrors("pushPermissionDenied"));
        return;
      }

      const registration = await ensureServiceWorker();
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const result = await subscribeToPushAction({
        subscription: JSON.parse(JSON.stringify(sub)),
        userAgent: navigator.userAgent,
      });

      if (!result.success) {
        await sub.unsubscribe();
        setError(result.error);
        return;
      }

      setSubscription(sub);
      setSubscriptionCount(result.subscriptionCount ?? subscriptionCount);
      setMessage(result.message ?? tPush("enabled"));
    });
  }

  function handleUnsubscribe() {
    if (!subscription) return;
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      const result = await unsubscribeFromPushAction(endpoint);

      setSubscription(null);
      if (!result.success) {
        setError(result.error);
        return;
      }

      setSubscriptionCount(result.subscriptionCount ?? Math.max(0, subscriptionCount - 1));
      setMessage(result.message ?? tPush("disabled"));
    });
  }

  function handleTest() {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await sendTestPushAction();
      if (!result.success) {
        setError(result.error);
        return;
      }
      setMessage(result.message ?? tPush("testSent"));
    });
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6">
      <h2 className="text-sm font-semibold text-neutral-800">{tPush("title")}</h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-500">
        {tPush("description")}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {subscription ? (
          <>
            <button
              type="button"
              onClick={handleTest}
              disabled={isPending || !canUsePush}
              className="rounded-lg bg-[#065F46] px-4 py-2 text-sm font-medium text-white hover:bg-[#054d3a] disabled:opacity-60"
            >
              {tPush("sendTest")}
            </button>
            <button
              type="button"
              onClick={handleUnsubscribe}
              disabled={isPending}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
            >
              {tPush("unsubscribe")}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={isPending || !canUsePush}
            className="rounded-lg bg-[#065F46] px-4 py-2 text-sm font-medium text-white hover:bg-[#054d3a] disabled:opacity-60"
          >
            {isPending ? tPush("enabling") : tPush("enable")}
          </button>
        )}
      </div>

      <p className="mt-3 text-xs text-neutral-500">
        {tPush("devicesActive")} {subscriptionCount}
        {!vapidPublicKey ? ` · ${tPush("vapidNeeded")}` : ""}
        {!supported ? ` · ${tPush("browserUnsupported")}` : ""}
      </p>
      {message && <p className="mt-2 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
