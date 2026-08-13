import "server-only";

import { getUserSubscription } from "@/features/subscriptions/data";
import { planHasFeature } from "@/features/subscriptions/plan-config-data";

export async function getMobileEntitlements(userId: string) {
  const subscription = await getUserSubscription(userId);
  const noAds = await planHasFeature(subscription.plan, "noAds");

  return {
    userId,
    plan: subscription.plan,
    showAds: !noAds,
    isSuspended: subscription.isSuspended,
  };
}
