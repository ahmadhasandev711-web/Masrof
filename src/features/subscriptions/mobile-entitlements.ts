import "server-only";

import { getUserSubscription } from "@/features/subscriptions/data";
import { getPlanConfig } from "@/features/subscriptions/plan-config-data";

export async function getMobileEntitlements(userId: string, workspaceId?: string) {
  let subscription;
  if (workspaceId) {
    const { getEffectiveSubscriptionForWorkspace } = await import("@/features/subscriptions/data");
    subscription = await getEffectiveSubscriptionForWorkspace(userId, workspaceId);
  } else {
    subscription = await getUserSubscription(userId);
  }
  const config = await getPlanConfig(subscription.plan);

  return {
    userId,
    plan: subscription.plan,
    showAds: !config.flags.noAds,
    isSuspended: subscription.isSuspended,
    flags: config.flags,
    limits: {
      maxInvoicesPerMonth: config.maxInvoicesPerMonth,
      maxClients: config.maxClients,
      maxActiveProjects: config.maxActiveProjects,
      maxWorkspaces: config.maxWorkspaces,
    },
  };
}
