import "server-only";

import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceAccess } from "@/features/workspaces/access";
import { assertWorkspacePlanFeature } from "@/features/subscriptions/data";
import { getWorkspaceSummary } from "@/features/transactions/data";
import { getCategoryBreakdown } from "@/features/reports/data";
import { getTranslations } from "next-intl/server";
import { resolveReportDateRange, type ReportRangePreset } from "@/features/reports/date-ranges";
import { connectToDatabase } from "@/lib/db/mongoose";
import { WorkspaceModel } from "@/models/workspace";

export type ReportExportPayload = {
  workspaceName: string;
  currency: string;
  preset: ReportRangePreset;
  range: { from: Date; to: Date };
  summary: { income: number | null; expense: number | null; net: number | null };
  expenseBreakdown: { name: string; total: number | null }[];
  incomeBreakdown: { name: string; total: number | null }[];
};

export async function fetchReportExportPayload(input: {
  workspaceId: string;
  preset: ReportRangePreset;
  from?: string;
  to?: string;
}): Promise<ReportExportPayload | { error: string }> {
  const session = await requireSession();
  await verifyWorkspaceAccess(session.user.id, input.workspaceId);

  const featureError = await assertWorkspacePlanFeature(session.user.id, input.workspaceId, "csvExport");
  if (featureError) {
    return { error: featureError };
  }

  const range = resolveReportDateRange(input.preset, {
    from: input.from ? new Date(input.from) : undefined,
    to: input.to ? new Date(input.to) : undefined,
  });

  const [summary, expenseBreakdownResult, incomeBreakdownResult, workspace, tErrors] = await Promise.all([
    getWorkspaceSummary(input.workspaceId, range),
    getCategoryBreakdown(input.workspaceId, "expense", range),
    getCategoryBreakdown(input.workspaceId, "income", range),
    connectToDatabase().then(() =>
      WorkspaceModel.findById(input.workspaceId).select("name currency").lean(),
    ),
    getTranslations("errors"),
  ]);

  return {
    workspaceName: workspace?.name ?? tErrors("workspaceDefault"),
    currency: workspace?.currency ?? "EGP",
    preset: input.preset,
    range,
    summary: {
      income: summary.income,
      expense: summary.expense,
      net: summary.net,
    },
    expenseBreakdown: expenseBreakdownResult.rows.map((row) => ({
      name: row.name,
      total: row.total,
    })),
    incomeBreakdown: incomeBreakdownResult.rows.map((row) => ({
      name: row.name,
      total: row.total,
    })),
  };
}
