import "server-only";

/**
 * Compatibility barrel. Prefer `@/features/reports/reports.repository` for persistence
 * and `@/features/reports/reports.service` when plan gates or export assembly are needed.
 */
import type { TransactionType } from "@/models/transaction";
import type { AppLocale } from "@/i18n/config";
import { reportsService } from "@/features/reports/reports.service";
import type {
  CategoryBreakdownResult,
  CategoryBreakdownRow,
  MonthlyTrendResult,
  MonthlyTrendRow,
} from "@/features/reports/reports.repository";

export type {
  CategoryBreakdownRow,
  CategoryBreakdownResult,
  MonthlyTrendRow,
  MonthlyTrendResult,
};

export async function getCategoryBreakdown(
  workspaceId: string,
  kind: TransactionType,
  range: { from: Date; to: Date },
  locale: AppLocale = "ar",
): Promise<CategoryBreakdownResult> {
  return reportsService.getCategoryBreakdown(workspaceId, kind, range, locale);
}

export async function getMonthlyTrend(
  workspaceId: string,
  monthsCount: number,
  locale = "ar-EG",
): Promise<MonthlyTrendResult> {
  return reportsService.getMonthlyTrend(workspaceId, monthsCount, locale);
}
