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
  const tConversion = await getTranslations("reports.conversion");
  const tPlan = await getTranslations("dashboard.plan");
  const { activeWorkspace, redirect } = await getActiveWorkspaceForPage(session.user.id);
  if (redirect) return redirect;
  const workspaceId = activeWorkspace._id.toString();
  const { plan } = await getWorkspacePlanContext(session.user.id, workspaceId);
  const currency = activeWorkspace.currency;

  if (!plan.advancedReports) {
    return (
      <div className="flex max-w-5xl flex-col gap-4">
        <h1 className="text-xl font-bold tracking-tight text-neutral-900">{tAdvanced("title")}</h1>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 text-sm text-neutral-800">
          <p className="font-medium text-emerald-950">{tAdvanced("gateMessage")}</p>
          <div className="mt-4">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-emerald-800"
            >
              {tPlan("viewPricing")}
            </Link>
          </div>
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
    <div className="flex max-w-5xl flex-col gap-8">
      <div>
        <Link
          href="/dashboard/reports"
          className="inline-flex items-center gap-1 text-sm font-medium text-neutral-500 transition hover:text-emerald-700"
        >
          {tAdvanced("backToReports")}
        </Link>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-neutral-900">{tAdvanced("title")}</h1>
        <p className="text-sm text-neutral-500">{activeWorkspace.name}</p>
      </div>

      <ReportConversionNotice
        canConvertAll={forecast.canConvertAll && clientResult.canConvertAll}
        missingRates={[...new Set([...forecast.missingRates, ...clientResult.missingRates])]}
      />

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-1">
          <h2 className="font-semibold text-neutral-900">{tAdvanced("cashFlow")}</h2>
          <p className="text-xs text-neutral-500">{tAdvanced("cashFlowHint")}</p>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
            <p className="text-xs font-medium text-emerald-800">{tAdvanced("avgIncome")}</p>
            <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-emerald-700">
              {forecast.avgMonthlyIncome == null
                ? tConversion("unavailable")
                : formatMoney(forecast.avgMonthlyIncome, { currency, locale: moneyLocale })}
            </p>
          </div>
          <div className="rounded-xl border border-red-100 bg-red-50/50 p-4">
            <p className="text-xs font-medium text-red-800">{tAdvanced("avgExpense")}</p>
            <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-red-600">
              {forecast.avgMonthlyExpense == null
                ? tConversion("unavailable")
                : formatMoney(forecast.avgMonthlyExpense, { currency, locale: moneyLocale })}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs font-medium text-neutral-600">{tAdvanced("projectedNet")}</p>
            <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-neutral-900">
              {forecast.projectedNetNext3Months == null
                ? tConversion("unavailable")
                : formatMoney(forecast.projectedNetNext3Months, { currency, locale: moneyLocale })}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-1">
          <h2 className="font-semibold text-neutral-900">{tAdvanced("cashFlowTrend")}</h2>
          <p className="text-xs text-neutral-500">{tAdvanced("cashFlowTrendHint")}</p>
        </div>

        <div className="mt-5 hidden overflow-x-auto md:block">
          <table className="w-full text-start text-sm">
            <thead className="border-b border-neutral-200 text-xs font-semibold uppercase text-neutral-500">
              <tr>
                <th className="px-3 py-3 text-start font-medium">{tAdvanced("monthColumn")}</th>
                <th className="px-3 py-3 text-start font-medium">{tAdvanced("incomeColumn")}</th>
                <th className="px-3 py-3 text-start font-medium">{tAdvanced("expenseColumn")}</th>
                <th className="px-3 py-3 text-start font-medium">{tAdvanced("netColumn")}</th>
                <th className="px-3 py-3 text-start font-medium">{tAdvanced("runningBalanceColumn")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {forecast.monthlySeries.map((row) => (
                <tr key={row.monthKey} className="transition hover:bg-neutral-50/50">
                  <td className="px-3 py-3 font-medium text-neutral-900">{row.label}</td>
                  <td className="px-3 py-3 font-mono tabular-nums text-emerald-700">
                    {row.income == null
                      ? tConversion("unavailable")
                      : formatMoney(row.income, { currency, locale: moneyLocale })}
                  </td>
                  <td className="px-3 py-3 font-mono tabular-nums text-red-600">
                    {row.expense == null
                      ? tConversion("unavailable")
                      : formatMoney(row.expense, { currency, locale: moneyLocale })}
                  </td>
                  <td className="px-3 py-3 font-mono font-semibold tabular-nums">
                    {row.net == null ? (
                      <span className="text-neutral-500">{tConversion("unavailable")}</span>
                    ) : (
                      <span className={row.net >= 0 ? "text-emerald-700" : "text-red-600"}>
                        {formatMoney(row.net, { currency, locale: moneyLocale })}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 font-mono font-medium tabular-nums text-neutral-800">
                    {row.runningBalance == null
                      ? tConversion("unavailable")
                      : formatMoney(row.runningBalance, { currency, locale: moneyLocale })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col gap-3 md:hidden">
          {forecast.monthlySeries.map((row) => (
            <div
              key={row.monthKey}
              className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4"
            >
              <div className="flex items-center justify-between border-b border-neutral-200/60 pb-2.5">
                <span className="font-semibold text-neutral-900">{row.label}</span>
                <span
                  className={`font-mono text-sm font-bold tabular-nums ${
                    (row.net ?? 0) >= 0 ? "text-emerald-700" : "text-red-600"
                  }`}
                >
                  {row.net == null
                    ? tConversion("unavailable")
                    : formatMoney(row.net, { currency, locale: moneyLocale })}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-neutral-500">{tAdvanced("incomeColumn")}: </span>
                  <span className="font-mono font-medium tabular-nums text-emerald-700">
                    {row.income == null
                      ? tConversion("unavailable")
                      : formatMoney(row.income, { currency, locale: moneyLocale })}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500">{tAdvanced("expenseColumn")}: </span>
                  <span className="font-mono font-medium tabular-nums text-red-600">
                    {row.expense == null
                      ? tConversion("unavailable")
                      : formatMoney(row.expense, { currency, locale: moneyLocale })}
                  </span>
                </div>
              </div>
              <div className="mt-2.5 flex items-center justify-between border-t border-neutral-200/50 pt-2 text-xs">
                <span className="text-neutral-500">{tAdvanced("runningBalanceColumn")}</span>
                <span className="font-mono font-semibold tabular-nums text-neutral-800">
                  {row.runningBalance == null
                    ? tConversion("unavailable")
                    : formatMoney(row.runningBalance, { currency, locale: moneyLocale })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
        <h2 className="font-semibold text-neutral-900">{tAdvanced("byClient")}</h2>
        {clientRows.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-neutral-200 p-8 text-center">
            <p className="text-sm text-neutral-500">{tAdvanced("noClientData")}</p>
          </div>
        ) : (
          <>
            <div className="mt-5 hidden overflow-x-auto md:block">
              <table className="w-full text-start text-sm">
                <thead className="border-b border-neutral-200 text-xs font-semibold uppercase text-neutral-500">
                  <tr>
                    <th className="px-3 py-3 text-start font-medium">{tAdvanced("clientColumn")}</th>
                    <th className="px-3 py-3 text-start font-medium">{tAdvanced("incomeColumn")}</th>
                    <th className="px-3 py-3 text-start font-medium">{tAdvanced("expenseColumn")}</th>
                    <th className="px-3 py-3 text-start font-medium">{tAdvanced("netColumn")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {clientRows.map((row) => (
                    <tr key={row.clientId} className="transition hover:bg-neutral-50/50">
                      <td className="px-3 py-3 font-medium text-neutral-900">
                        <div className="flex items-center gap-2">
                          <span>{row.clientName}</span>
                          <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-mono text-[11px] tabular-nums text-neutral-600">
                            {row.transactionCount}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-mono tabular-nums text-emerald-700">
                        {row.income == null
                          ? tConversion("unavailable")
                          : formatMoney(row.income, { currency, locale: moneyLocale })}
                      </td>
                      <td className="px-3 py-3 font-mono tabular-nums text-red-600">
                        {row.expense == null
                          ? tConversion("unavailable")
                          : formatMoney(row.expense, { currency, locale: moneyLocale })}
                      </td>
                      <td className="px-3 py-3 font-mono font-semibold tabular-nums">
                        {row.net == null ? (
                          <span className="text-neutral-500">{tConversion("unavailable")}</span>
                        ) : (
                          <span className={row.net >= 0 ? "text-emerald-700" : "text-red-600"}>
                            {formatMoney(row.net, { currency, locale: moneyLocale })}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-col gap-3 md:hidden">
              {clientRows.map((row) => (
                <div
                  key={row.clientId}
                  className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4"
                >
                  <div className="flex items-center justify-between border-b border-neutral-200/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-900">{row.clientName}</span>
                      <span className="rounded-full bg-neutral-200/70 px-2 py-0.5 font-mono text-[10px] tabular-nums text-neutral-600">
                        {row.transactionCount}
                      </span>
                    </div>
                    <span
                      className={`font-mono text-sm font-bold tabular-nums ${
                        (row.net ?? 0) >= 0 ? "text-emerald-700" : "text-red-600"
                      }`}
                    >
                      {row.net == null
                        ? tConversion("unavailable")
                        : formatMoney(row.net, { currency, locale: moneyLocale })}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-neutral-500">{tAdvanced("incomeColumn")}: </span>
                      <span className="font-mono font-medium tabular-nums text-emerald-700">
                        {row.income == null
                          ? tConversion("unavailable")
                          : formatMoney(row.income, { currency, locale: moneyLocale })}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500">{tAdvanced("expenseColumn")}: </span>
                      <span className="font-mono font-medium tabular-nums text-red-600">
                        {row.expense == null
                          ? tConversion("unavailable")
                          : formatMoney(row.expense, { currency, locale: moneyLocale })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
