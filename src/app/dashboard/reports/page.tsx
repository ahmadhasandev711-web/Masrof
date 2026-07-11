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
import { ExportCsvButton } from "@/features/reports/components/export-csv-button";
import { ExportReportExcelButton } from "@/features/reports/components/export-report-excel-button";
import { ExportPdfButton } from "@/features/reports/components/export-pdf-button";
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
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">{tPages("title")}</h1>
          <p className="text-sm text-neutral-500">{activeWorkspace.name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/reports/advanced"
            className="rounded-lg border border-[#065F46]/20 bg-[#ECFDF5] px-4 py-2 text-sm font-medium text-[#065F46] hover:bg-[#D1FAE5]"
          >
            {tPages("advanced")}
          </Link>
          {plan.csvExport ? (
            <>
              <ExportCsvButton
                workspaceId={workspaceId}
                preset={preset}
                from={rawParams.from}
                to={rawParams.to}
              />
              <ExportReportExcelButton
                workspaceId={workspaceId}
                preset={preset}
                from={rawParams.from}
                to={rawParams.to}
              />
            </>
          ) : null}
          {plan.pdfExport ? (
            <ExportPdfButton preset={preset} from={rawParams.from} to={rawParams.to} />
          ) : (
            <Link
              href="/pricing"
              className="rounded-lg border border-[#065F46]/20 bg-[#ECFDF5] px-4 py-2 text-sm font-medium text-[#065F46] hover:bg-[#D1FAE5]"
            >
              {tReports("export.upgradeLink")}
            </Link>
          )}
        </div>
      </div>

        <ReportRangeSelector
          currentPreset={preset}
          currentFrom={rawParams.from}
          currentTo={rawParams.to}
        />

        <ReportConversionNotice
          canConvertAll={conversion.canConvertAll}
          missingRates={conversion.missingRates}
        />

        <ReportSummaryCards
          income={summary.income}
          expense={summary.expense}
          net={summary.net}
          currency={currency}
        />

        <MonthlyTrendChart
          months={monthlyTrendResult.months}
          currency={currency}
          moneyLocale={moneyLocale}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <CategoryBreakdown
            title={tReports("breakdown.expenseByCategory")}
            rows={expenseBreakdownResult.rows}
            currency={currency}
            barColorClass="bg-red-500"
          />
          <CategoryBreakdown
            title={tReports("breakdown.incomeByCategory")}
            rows={incomeBreakdownResult.rows}
            currency={currency}
            barColorClass="bg-emerald-600"
          />
        </div>

        <AccountSummary accounts={accounts} baseCurrency={currency} />
    </div>
  );
}
