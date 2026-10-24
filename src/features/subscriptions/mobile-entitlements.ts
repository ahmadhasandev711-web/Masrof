import "server-only";

import { getUserSubscription } from "@/features/subscriptions/data";
import { getPlanConfig } from "@/features/subscriptions/plan-config-data";

export async function getMobileEntitlements(userId: string) {
  const subscription = await getUserSubscription(userId);
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
