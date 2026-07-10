"use server";

import { getTranslations } from "next-intl/server";
import { requireSession } from "@/features/auth/session";
import { assertPlanFeature } from "@/features/subscriptions/data";
import {
  deletePushSubscription,
  getPushSubscriptionCount,
  isPushConfigured,
  sendPushToUser,
  type StoredPushSubscription,
  upsertPushSubscription,
} from "@/lib/push";

export type PushActionResult =
  | { success: true; message?: string; subscriptionCount?: number }
  | { success: false; error: string };

export async function subscribeToPushAction(input: {
  subscription: StoredPushSubscription;
  userAgent?: string | null;
}): Promise<PushActionResult> {
  const session = await requireSession();
  const tErrors = await getTranslations("errors");

  const featureError = await assertPlanFeature(session.user.id, "pushNotifications");
  if (featureError) return { success: false, error: featureError };

  if (!isPushConfigured()) {
    return { success: false, error: tErrors("pushNotEnabled") };
  }

  await upsertPushSubscription({
    userId: session.user.id,
    subscription: input.subscription,
    userAgent: input.userAgent,
  });

  return {
    success: true,
    message: tErrors("pushEnabled"),
    subscriptionCount: await getPushSubscriptionCount(session.user.id),
  };
}

export async function unsubscribeFromPushAction(endpoint: string): Promise<PushActionResult> {
  const session = await requireSession();
  const tErrors = await getTranslations("errors");
  await deletePushSubscription(session.user.id, endpoint);

  return {
    success: true,
    message: tErrors("pushDisabled"),
    subscriptionCount: await getPushSubscriptionCount(session.user.id),
  };
}

export async function sendTestPushAction(): Promise<PushActionResult> {
  const session = await requireSession();
  const tErrors = await getTranslations("errors");

  const featureError = await assertPlanFeature(session.user.id, "pushNotifications");
  if (featureError) return { success: false, error: featureError };

  const result = await sendPushToUser(session.user.id, {
    title: tErrors("pushTestTitle"),
    body: tErrors("pushTestBody"),
    url: "/dashboard",
  });

  if (!result.configured) {
    return { success: false, error: tErrors("pushNotEnabled") };
  }

  if (result.sent === 0) {
    return { success: false, error: tErrors("pushNoDevice") };
  }

  return { success: true, message: tErrors("pushTestSent") };
}
