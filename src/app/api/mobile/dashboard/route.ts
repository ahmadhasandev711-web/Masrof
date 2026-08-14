import { NextResponse } from "next/server";
import { getDashboardOverview } from "@/features/dashboard/data";
import { getDashboardAlerts } from "@/features/dashboard/alerts";
import {
  mobileErrorResponse,
  requireMobileSession,
  requireMobileWorkspace,
} from "@/lib/mobile/session";

export async function GET(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  const access = await requireMobileWorkspace(session.user.id, workspaceId, "read");
  if (access instanceof NextResponse) return access;

  try {
    const [overview, alerts] = await Promise.all([
      getDashboardOverview(access.workspaceId),
      getDashboardAlerts(access.workspaceId),
    ]);

    return NextResponse.json({
      workspace: {
        id: access.workspaceId,
        name: access.workspace.name,
        currency: access.workspace.currency,
      },
      totalBalance: overview.totalBalance,
      monthIncome: overview.monthSummary.income,
      monthExpense: overview.monthSummary.expense,
      monthNet: overview.monthSummary.net,
      canConvertAll: overview.monthSummary.canConvertAll,
      budgetWarnings: alerts.budgetWarnings.length,
      dueRecurring: alerts.dueRecurring.length,
      receivableProjects: alerts.receivableProjects.length,
    });
  } catch (error) {
    return mobileErrorResponse(error);
  }
}
