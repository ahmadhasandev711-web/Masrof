import { NextResponse } from "next/server";
import { asIsoDate } from "@contracts/mobile/common";
import { mobileReportsResponseSchema } from "@contracts/mobile/reports";
import { reportsService } from "@/features/reports/reports.service";
import { transactionsService } from "@/features/transactions/transactions.service";
import {
  REPORT_RANGE_PRESETS,
  resolveReportDateRange,
  type ReportRangePreset,
} from "@/features/reports/date-ranges";
import type { CategoryBreakdownRow } from "@/features/reports/reports.repository";
import { getIntlLocale, type AppLocale } from "@/i18n/config";
import {
  mobileErrorResponse,
  requireMobileSession,
  requireMobileWorkspace,
} from "@/lib/mobile/session";

function toMobileCategoryRow(row: CategoryBreakdownRow) {
  return {
    categoryId: String(row.categoryId),
    name: row.name,
    icon: row.icon,
    total: row.total,
  };
}

export async function GET(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  const presetRaw = url.searchParams.get("preset") ?? "thisMonth";
  const preset = (REPORT_RANGE_PRESETS as readonly string[]).includes(presetRaw)
    ? (presetRaw as ReportRangePreset)
    : "thisMonth";

  const access = await requireMobileWorkspace(session.user.id, workspaceId, "read");
  if (access instanceof NextResponse) return access;

  const locale: AppLocale = url.searchParams.get("locale") === "en" ? "en" : "ar";

  try {
    const range = resolveReportDateRange(preset, {
      from: url.searchParams.get("from") ? new Date(url.searchParams.get("from")!) : undefined,
      to: url.searchParams.get("to") ? new Date(url.searchParams.get("to")!) : undefined,
    });

    const [summary, expenseBreakdown, incomeBreakdown, trend] = await Promise.all([
      transactionsService.getWorkspaceSummary(access.workspaceId, range),
      reportsService.getCategoryBreakdown(access.workspaceId, "expense", range, locale),
      reportsService.getCategoryBreakdown(access.workspaceId, "income", range, locale),
      reportsService.getMonthlyTrend(access.workspaceId, 6, getIntlLocale(locale)),
    ]);

    const body = mobileReportsResponseSchema.parse({
      preset,
      range: {
        from: asIsoDate(range.from),
        to: asIsoDate(range.to),
      },
      summary,
      expenseBreakdown: {
        ...expenseBreakdown,
        rows: expenseBreakdown.rows.map(toMobileCategoryRow),
      },
      incomeBreakdown: {
        ...incomeBreakdown,
        rows: incomeBreakdown.rows.map(toMobileCategoryRow),
      },
      trend,
      currency: access.workspace.currency,
    });
    return NextResponse.json(body);
  } catch (error) {
    return mobileErrorResponse(error);
  }
}
