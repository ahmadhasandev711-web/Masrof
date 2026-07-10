import "server-only";

import { cache } from "react";
import { getWorkspaceBalanceSummary } from "@/features/accounts/data";
import { getWorkspaceSummary } from "@/features/transactions/data";

/** Dashboard home stats — cached per request for layout + page reuse. */
export const getDashboardOverview = cache(async (workspaceId: string) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [balanceSummary, monthSummary] = await Promise.all([
    getWorkspaceBalanceSummary(workspaceId),
    getWorkspaceSummary(workspaceId, { from: startOfMonth, to: now }),
  ]);

  return {
    totalBalance: balanceSummary.convertedTotalMinor ?? balanceSummary.byCurrency[0]?.totalMinor ?? 0,
    balanceSummary,
    monthSummary,
  };
});
