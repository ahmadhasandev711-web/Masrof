import { requireSession } from "@/features/auth/session";
import { getDashboardHomeData } from "@/features/dashboard/alerts";
import { DashboardAlerts } from "@/features/dashboard/components/dashboard-alerts";
import { getActiveWorkspaceForPage } from "@/features/workspaces/page-gate";
import { getMonthlyTrend } from "@/features/reports/data";
import { MonthlyTrendChart } from "@/features/reports/components/monthly-trend-chart";
import {
  dispatchDashboardEmailNotifications,
  dispatchDashboardPushNotifications,
} from "@/features/notifications/dispatch";
import { getUserWhatsAppPhone } from "@/features/whatsapp/data";
import { formatMoney } from "@/lib/money";
import { CurrencyBalancesSummary } from "@/features/accounts/components/currency-balances-summary";
import { getIntlLocale, type AppLocale } from "@/i18n/config";
import { getWorkspacePlanContext } from "@/features/subscriptions/data";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

export default async function DashboardPage() {
  const session = await requireSession();
  const { activeWorkspace, redirect } = await getActiveWorkspaceForPage(session.user.id);
  if (redirect) return redirect;
  const workspaceId = activeWorkspace._id.toString();
  const currency = activeWorkspace.currency;
  const locale = (await getLocale()) as AppLocale;
  const moneyLocale = getIntlLocale(locale);
  const t = await getTranslations("dashboard");

  const [
    { plan },
    { balanceSummary, monthSummary, budgetWarnings, dueRecurring, receivableProjects },
    monthlyTrendResult,
    userWhatsAppPhone,
  ] = await Promise.all([
    getWorkspacePlanContext(session.user.id, workspaceId),
    getDashboardHomeData(workspaceId),
    getMonthlyTrend(workspaceId, 6, moneyLocale),
    getUserWhatsAppPhone(session.user.id),
  ]);

  // Don't block HTML on email/push — Hostinger TTFB was waiting on SMTP + dedupe writes.
  void Promise.all([
    dispatchDashboardEmailNotifications({
      userId: session.user.id,
      userEmail: session.user.email,
      workspaceId,
      workspaceName: activeWorkspace.name,
      currency,
      budgetWarnings,
      dueRecurring,
      locale,
    }),
    dispatchDashboardPushNotifications({
      userId: session.user.id,
      workspaceId,
      workspaceName: activeWorkspace.name,
      currency,
      budgetWarnings,
      dueRecurring,
      locale,
    }),
  ]).catch((error) => {
    console.error("[notifications] dashboard dispatch failed:", error);
  });

  return (
    <div className="flex w-full max-w-full flex-col gap-6 overflow-x-clip">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">
          {activeWorkspace.name}
        </h1>
        <p className="text-sm text-neutral-500">{t("workspaceSummary")}</p>
      </div>

      <DashboardAlerts
        budgetWarnings={budgetWarnings}
        dueRecurring={dueRecurring}
        receivableProjects={receivableProjects}
        currency={currency}
        workspaceName={activeWorkspace.name}
        userWhatsAppPhone={userWhatsAppPhone}
        canUseWhatsApp={plan.whatsappReminders}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#E4DFD3] bg-white p-4 text-center shadow-sm">
          <p className="text-xs text-[#1C1B1A]/45">{t("totalBalance")}</p>
          <div className="mt-1">
            <CurrencyBalancesSummary
              byCurrency={balanceSummary.byCurrency}
              baseCurrency={balanceSummary.baseCurrency}
              convertedTotalMinor={balanceSummary.convertedTotalMinor}
              missingRates={balanceSummary.missingRates}
              moneyLocale={moneyLocale}
            />
          </div>
          {balanceSummary.byCurrency.length > 1 && (
            <Link href="/dashboard/accounts" className="mt-2 inline-block text-xs text-[#065F46] hover:underline">
              {t("manageCurrencies")}
            </Link>
          )}
        </div>
        <div className="rounded-2xl border border-[#E4DFD3] bg-white p-4 text-center shadow-sm">
          <p className="text-xs text-[#1C1B1A]/45">{t("monthIncome")}</p>
          <p className="mt-1 font-bold text-[#065F46]">
            {monthSummary.income == null
              ? t("addExchangeRates")
              : formatMoney(monthSummary.income, { currency, locale: moneyLocale })}
          </p>
        </div>
        <div className="rounded-2xl border border-[#E4DFD3] bg-white p-4 text-center shadow-sm">
          <p className="text-xs text-[#1C1B1A]/45">{t("monthExpense")}</p>
          <p className="mt-1 font-bold text-red-600">
            {monthSummary.expense == null
              ? t("addExchangeRates")
              : formatMoney(monthSummary.expense, { currency, locale: moneyLocale })}
          </p>
        </div>
      </div>

      <MonthlyTrendChart months={monthlyTrendResult.months} currency={currency} moneyLocale={moneyLocale} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/dashboard/transactions"
          className="rounded-2xl border border-[#E4DFD3] bg-white p-5 shadow-sm transition hover:border-[#065F46]/30"
        >
          <h2 className="font-semibold text-neutral-900">{t("transactionsTitle")}</h2>
          <p className="mt-1 text-sm text-neutral-500">{t("transactionsDesc")}</p>
        </Link>

        <Link
          href="/dashboard/accounts"
          className="rounded-2xl border border-[#E4DFD3] bg-white p-5 shadow-sm transition hover:border-[#065F46]/30"
        >
          <h2 className="font-semibold text-neutral-900">{t("accountsTitle")}</h2>
          <p className="mt-1 text-sm text-neutral-500">{t("accountsDesc")}</p>
        </Link>

        <Link
          href="/dashboard/budgets"
          className="rounded-2xl border border-[#E4DFD3] bg-white p-5 shadow-sm transition hover:border-[#065F46]/30"
        >
          <h2 className="font-semibold text-neutral-900">{t("budgetsTitle")}</h2>
          <p className="mt-1 text-sm text-neutral-500">{t("budgetsDesc")}</p>
        </Link>

        <Link
          href="/dashboard/reports"
          className="rounded-2xl border border-[#E4DFD3] bg-white p-5 shadow-sm transition hover:border-[#065F46]/30"
        >
          <h2 className="font-semibold text-neutral-900">{t("reportsTitle")}</h2>
          <p className="mt-1 text-sm text-neutral-500">{t("reportsDesc")}</p>
        </Link>
      </div>
    </div>
  );
}
