import Link from "next/link";
import { requireSession } from "@/features/auth/session";
import { getActiveWorkspaceForPage } from "@/features/workspaces/page-gate";
import { getWorkspacePlanContext } from "@/features/subscriptions/data";
import { getClientBreakdownReport, getCashFlowForecast } from "@/features/reports/advanced-data";
import { ReportConversionNotice } from "@/features/reports/components/conversion-notice";
import { formatMoney } from "@/lib/money";
import { getIntlLocale, type AppLocale } from "@/i18n/config";
import { getLocale, getTranslations } from "next-intl/server";

export default async function AdvancedReportsPage() {
  const session = await requireSession();
  const locale = (await getLocale()) as AppLocale;
  const moneyLocale = getIntlLocale(locale);
  const tAdvanced = await getTranslations("reports.advanced");
  const tPages = await getTranslations("pages.reports");
  const tConversion = await getTranslations("reports.conversion");
  const tPlan = await getTranslations("dashboard.plan");
  const { activeWorkspace, redirect } = await getActiveWorkspaceForPage(session.user.id);
  if (redirect) return redirect;
  const workspaceId = activeWorkspace._id.toString();
  const { plan } = await getWorkspacePlanContext(session.user.id, workspaceId);
  const currency = activeWorkspace.currency;

  if (!plan.advancedReports) {
    return (
      <div className="flex max-w-2xl flex-col gap-4">
        <h1 className="text-xl font-semibold text-neutral-900">{tAdvanced("title")}</h1>
        <div className="rounded-xl border border-[#065F46]/15 bg-[#ECFDF5]/50 p-4 text-sm">
          {tAdvanced("gateMessage")}{" "}
          <Link href="/pricing" className="font-medium text-[#065F46] hover:underline">
            {tPlan("viewPricing")}
          </Link>
          .
        </div>
      </div>
    );
  }

  const [clientResult, forecast] = await Promise.all([
    getClientBreakdownReport(workspaceId),
    getCashFlowForecast(workspaceId),
  ]);
  const clientRows = clientResult.rows;

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <Link href="/dashboard/reports" className="text-sm text-neutral-500 hover:text-[#065F46]">
          {tPages("backToReports")}
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-neutral-900">{tAdvanced("title")}</h1>
        <p className="text-sm text-neutral-500">{activeWorkspace.name}</p>
      </div>

      <ReportConversionNotice
        canConvertAll={forecast.canConvertAll && clientResult.canConvertAll}
        missingRates={[...new Set([...forecast.missingRates, ...clientResult.missingRates])]}
      />

      <section className="rounded-2xl border border-[#E4DFD3] bg-white p-6">
        <h2 className="font-semibold text-[#1C1B1A]">{tAdvanced("cashFlow")}</h2>
        <p className="mt-1 text-xs text-neutral-500">{tAdvanced("cashFlowHint")}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-[#ECFDF5]/60 p-4 text-center">
            <p className="text-xs text-neutral-500">{tAdvanced("avgIncome")}</p>
            <p className="mt-1 font-bold text-[#065F46]">
              {forecast.avgMonthlyIncome == null
                ? tConversion("unavailable")
                : formatMoney(forecast.avgMonthlyIncome, { currency, locale: moneyLocale })}
            </p>
          </div>
          <div className="rounded-xl bg-red-50 p-4 text-center">
            <p className="text-xs text-neutral-500">{tAdvanced("avgExpense")}</p>
            <p className="mt-1 font-bold text-red-600">
              {forecast.avgMonthlyExpense == null
                ? tConversion("unavailable")
                : formatMoney(forecast.avgMonthlyExpense, { currency, locale: moneyLocale })}
            </p>
          </div>
          <div className="rounded-xl bg-neutral-50 p-4 text-center">
            <p className="text-xs text-neutral-500">{tAdvanced("projectedNet")}</p>
            <p className="mt-1 font-bold text-neutral-800">
              {forecast.projectedNetNext3Months == null
                ? tConversion("unavailable")
                : formatMoney(forecast.projectedNetNext3Months, { currency, locale: moneyLocale })}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#E4DFD3] bg-white p-6">
        <h2 className="font-semibold text-[#1C1B1A]">{tAdvanced("cashFlowTrend")}</h2>
        <p className="mt-1 text-xs text-neutral-500">{tAdvanced("cashFlowTrendHint")}</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-right text-sm">
            <thead className="border-b text-neutral-500">
              <tr>
                <th className="py-2 font-medium">{tAdvanced("monthColumn")}</th>
                <th className="py-2 font-medium">{tAdvanced("incomeColumn")}</th>
                <th className="py-2 font-medium">{tAdvanced("expenseColumn")}</th>
                <th className="py-2 font-medium">{tAdvanced("netColumn")}</th>
                <th className="py-2 font-medium">{tAdvanced("runningBalanceColumn")}</th>
              </tr>
            </thead>
            <tbody>
              {forecast.monthlySeries.map((row) => (
                <tr key={row.monthKey} className="border-b border-neutral-100">
                  <td className="py-2 font-medium">{row.label}</td>
                  <td className="py-2 text-emerald-700">
                    {row.income == null
                      ? tConversion("unavailable")
                      : formatMoney(row.income, { currency, locale: moneyLocale })}
                  </td>
                  <td className="py-2 text-red-600">
                    {row.expense == null
                      ? tConversion("unavailable")
                      : formatMoney(row.expense, { currency, locale: moneyLocale })}
                  </td>
                  <td className="py-2">
                    {row.net == null
                      ? tConversion("unavailable")
                      : formatMoney(row.net, { currency, locale: moneyLocale })}
                  </td>
                  <td className="py-2 font-medium">
                    {row.runningBalance == null
                      ? tConversion("unavailable")
                      : formatMoney(row.runningBalance, { currency, locale: moneyLocale })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-[#E4DFD3] bg-white p-6">
        <h2 className="font-semibold text-[#1C1B1A]">{tAdvanced("byClient")}</h2>
        {clientRows.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">
            {tAdvanced("noClientData")}
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] text-right text-sm">
              <thead className="border-b text-neutral-500">
                <tr>
                  <th className="py-2 font-medium">{tAdvanced("clientColumn")}</th>
                  <th className="py-2 font-medium">{tAdvanced("incomeColumn")}</th>
                  <th className="py-2 font-medium">{tAdvanced("expenseColumn")}</th>
                  <th className="py-2 font-medium">{tAdvanced("netColumn")}</th>
                </tr>
              </thead>
              <tbody>
                {clientRows.map((row) => (
                  <tr key={row.clientId} className="border-b border-neutral-100">
                    <td className="py-2 font-medium">{row.clientName}</td>
                    <td className="py-2 text-emerald-700">
                      {row.income == null
                        ? tConversion("unavailable")
                        : formatMoney(row.income, { currency, locale: moneyLocale })}
                    </td>
                    <td className="py-2 text-red-600">
                      {row.expense == null
                        ? tConversion("unavailable")
                        : formatMoney(row.expense, { currency, locale: moneyLocale })}
                    </td>
                    <td className="py-2 font-medium">
                      {row.net == null
                        ? tConversion("unavailable")
                        : formatMoney(row.net, { currency, locale: moneyLocale })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
