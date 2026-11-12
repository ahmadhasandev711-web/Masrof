import "server-only";

import { getLocale, getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/config";
import type { TransactionType } from "@/models/transaction";
import { resolveReportDateRange, type ReportRangePreset } from "@/features/reports/date-ranges";
import {
  ReportsRepository,
  reportsRepository,
  type CategoryBreakdownResult,
  type MonthlyTrendResult,
} from "@/features/reports/reports.repository";
import { transactionsRepository } from "@/features/transactions/transactions.repository";
import { requirePlanFeature } from "@/server/kernel/plan-policy";
import { ok, type Result } from "@/server/kernel/result";
import { isAppError } from "@/server/kernel/errors";

export type ReportExportPayload = {
  workspaceName: string;
  currency: string;
  preset: ReportRangePreset;
  range: { from: Date; to: Date };
  summary: { income: number | null; expense: number | null; net: number | null };
  expenseBreakdown: { name: string; total: number | null }[];
  incomeBreakdown: { name: string; total: number | null }[];
};

export class ReportsService {
  constructor(private readonly repo: ReportsRepository = reportsRepository) {}

  getCategoryBreakdown(
    workspaceId: string,
    kind: TransactionType,
    range: { from: Date; to: Date },
    locale: AppLocale = "ar",
  ): Promise<CategoryBreakdownResult> {
    return this.repo.getCategoryBreakdown(workspaceId, kind, range, locale);
  }

  getMonthlyTrend(
    workspaceId: string,
    monthsCount: number,
    locale = "ar-EG",
  ): Promise<MonthlyTrendResult> {
    return this.repo.getMonthlyTrend(workspaceId, monthsCount, locale);
  }

  /**
   * Assembles a report export after the csvExport plan gate.
   * Callers still own session + workspace access checks.
   */
  async getExportPayload(
    userId: string,
    input: {
      workspaceId: string;
      preset: ReportRangePreset;
      from?: string;
      to?: string;
    },
  ): Promise<Result<ReportExportPayload>> {
    const feature = await requirePlanFeature(userId, input.workspaceId, "csvExport");
    if (!feature.ok) return feature;

    const range = resolveReportDateRange(input.preset, {
      from: input.from ? new Date(input.from) : undefined,
      to: input.to ? new Date(input.to) : undefined,
    });

    const locale = (await getLocale()) as AppLocale;
    const [summary, expenseBreakdownResult, incomeBreakdownResult, workspace, tErrors] =
      await Promise.all([
        transactionsRepository.getWorkspaceSummary(input.workspaceId, range),
        this.repo.getCategoryBreakdown(input.workspaceId, "expense", range, locale),
        this.repo.getCategoryBreakdown(input.workspaceId, "income", range, locale),
        this.repo.findWorkspaceExportMeta(input.workspaceId),
        getTranslations("errors"),
      ]);

    return ok({
      workspaceName: workspace.name ?? tErrors("workspaceDefault"),
      currency: workspace.currency ?? "EGP",
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
    });
  }
}

export const reportsService = new ReportsService();

/** Map service Result failures to the legacy `{ error: string }` shape used by export actions. */
export function exportPayloadErrorMessage(error: unknown): string {
  if (isAppError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return "unknown";
}

export function toExportPayloadOrError(
  result: Result<ReportExportPayload>,
): ReportExportPayload | { error: string } {
  if (!result.ok) return { error: exportPayloadErrorMessage(result.error) };
  return result.value;
}
