import { requireSession } from "@/features/auth/session";
import { getActiveWorkspaceForPage } from "@/features/workspaces/page-gate";
import { listAccountsForWorkspace } from "@/features/accounts/data";
import { getWorkspaceSummary } from "@/features/transactions/data";
import { getCategoryBreakdown, getMonthlyTrend } from "@/features/reports/data";
import {
  resolveReportDateRange,
  REPORT_RANGE_PRESETS,
  type ReportRangePreset,
} from "@/features/reports/date-ranges";
import { ReportRangeSelector } from "@/features/reports/components/range-selector";
import { ReportSummaryCards } from "@/features/reports/components/summary-cards";
import { CategoryBreakdown } from "@/features/reports/components/category-breakdown";
import { MonthlyTrendChart } from "@/features/reports/components/monthly-trend-chart";
import { ReportConversionNotice } from "@/features/reports/components/conversion-notice";
import { ReportExportMenu } from "@/features/reports/components/report-export-menu";
import { AccountSummary } from "@/features/reports/components/account-summary";
import { getWorkspacePlanContext } from "@/features/subscriptions/data";
import { getIntlLocale, type AppLocale } from "@/i18n/config";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

type SearchParams = Record<string, string | undefined>;

function isValidPreset(value: string | undefined): value is ReportRangePreset {
  return !!value && (REPORT_RANGE_PRESETS as readonly string[]).includes(value);
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireSession();
  const moneyLocale = getIntlLocale((await getLocale()) as AppLocale);
  const tPages = await getTranslations("pages.reports");
  const tReports = await getTranslations("reports");
  const { activeWorkspace, redirect } = await getActiveWorkspaceForPage(session.user.id);
  if (redirect) return redirect;
  const workspaceId = activeWorkspace._id.toString();
  const { plan } = await getWorkspacePlanContext(session.user.id, workspaceId);
  const currency = activeWorkspace.currency;

  const rawParams = await searchParams;
  const preset: ReportRangePreset = isValidPreset(rawParams.range) ? rawParams.range : "thisMonth";
  const customFrom = rawParams.from ? new Date(rawParams.from) : undefined;
  const customTo = rawParams.to ? new Date(rawParams.to) : undefined;

  const range = resolveReportDateRange(preset, { from: customFrom, to: customTo });

  const [summary, incomeBreakdownResult, expenseBreakdownResult, monthlyTrendResult, accounts] =
    await Promise.all([
      getWorkspaceSummary(workspaceId, range),
      getCategoryBreakdown(workspaceId, "income", range),
      getCategoryBreakdown(workspaceId, "expense", range),
      getMonthlyTrend(workspaceId, 6, moneyLocale),
      listAccountsForWorkspace(workspaceId),
    ]);

  const conversion = {
    canConvertAll:
      summary.canConvertAll &&
      incomeBreakdownResult.canConvertAll &&
      expenseBreakdownResult.canConvertAll &&
      monthlyTrendResult.canConvertAll,
    missingRates: [
      ...new Set([
        ...summary.missingRates,
        ...incomeBreakdownResult.missingRates,
        ...expenseBreakdownResult.missingRates,
        ...monthlyTrendResult.missingRates,
      ]),
    ],
  };

  return (
    <div className="flex w-full max-w-5xl flex-col gap-6">
      {/* 1. Header with Title & Unified Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl">{tPages("title")}</h1>
          <p className="text-xs text-neutral-500 mt-0.5">{activeWorkspace.name}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/reports/advanced"
            className="inline-flex items-center gap-1 rounded-xl border border-[#065F46]/20 bg-[#ECFDF5] px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#065F46] hover:bg-[#D1FAE5] transition"
          >
            <span></span>
            <span>{tPages("advanced")}</span>
          </Link>

          <ReportExportMenu
            workspaceId={workspaceId}
            preset={preset}
            from={rawParams.from}
            to={rawParams.to}
            canCsv={plan.csvExport}
            canPdf={plan.pdfExport}
          />
        </div>
      </div>

      {/* 2. Quick Range Filter Pills */}
      <ReportRangeSelector
        currentPreset={preset}
        currentFrom={rawParams.from}
        currentTo={rawParams.to}
      />

      {/* 3. Conversion Notice if any */}
      <ReportConversionNotice
        canConvertAll={conversion.canConvertAll}
        missingRates={conversion.missingRates}
      />

      {/* 4. Financial Summary Cards (Income / Expense / Net & Savings Rate) */}
      <ReportSummaryCards
        income={summary.income}
        expense={summary.expense}
        net={summary.net}
        currency={currency}
      />

      {/* 5. Responsive Monthly Trend Chart */}
      <MonthlyTrendChart
        months={monthlyTrendResult.months}
        currency={currency}
        moneyLocale={moneyLocale}
      />

      {/* 6. Income & Expense Category Breakdowns with Exact Percentages */}
      <div className="grid gap-4 sm:grid-cols-2">
        <CategoryBreakdown
          title={tReports("breakdown.expenseByCategory")}
          rows={expenseBreakdownResult.rows}
          currency={currency}
          barColorClass="bg-rose-500"
        />
        <CategoryBreakdown
          title={tReports("breakdown.incomeByCategory")}
          rows={incomeBreakdownResult.rows}
          currency={currency}
          barColorClass="bg-[#065F46]"
        />
      </div>

      {/* 7. Accounts Liquidity Balances Summary */}
      <AccountSummary accounts={accounts} baseCurrency={currency} />
    </div>
  );
}
