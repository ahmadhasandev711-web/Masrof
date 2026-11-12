import "server-only";

import { accountsRepository } from "@/features/accounts/accounts.repository";
import { transactionsRepository } from "@/features/transactions/transactions.repository";

/**
 * Dashboard reads compose account + transaction persistence — no local mongoose
 * collections. Kept as a repository so mobile/web share one overview entrypoint.
 */
export class DashboardRepository {
  async getOverview(workspaceId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [balanceSummary, monthSummary] = await Promise.all([
      accountsRepository.getWorkspaceBalanceSummary(workspaceId),
      transactionsRepository.getWorkspaceSummary(workspaceId, {
        from: startOfMonth,
        to: now,
      }),
    ]);

    return {
      totalBalance:
        balanceSummary.convertedTotalMinor ?? balanceSummary.byCurrency[0]?.totalMinor ?? 0,
      balanceSummary,
      monthSummary,
    };
  }
}

export const dashboardRepository = new DashboardRepository();
