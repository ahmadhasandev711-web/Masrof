import { getDashboardHomeData } from "@/features/dashboard/alerts";
import { DashboardAlerts } from "@/features/dashboard/components/dashboard-alerts";
import { getMonthlyTrend } from "@/features/reports/data";
import { MonthlyTrendChart } from "@/features/reports/components/monthly-trend-chart";
import {
  getWorkspaceReceivablesSummary,
  getOpenInvoicesRadar,
} from "@/features/invoices/receivables-data";
import { getDebtSummary } from "@/features/debts/data";
import { listProjectsWithTotals } from "@/features/projects/data";
import {
  dispatchDashboardEmailNotifications,
  dispatchDashboardPushNotifications,
} from "@/features/notifications/dispatch";
import { getUserWhatsAppPhone } from "@/features/whatsapp/data";
import { formatMoney } from "@/lib/money";
import { CurrencyBalancesSummary } from "@/features/accounts/components/currency-balances-summary";
import { getIntlLocale, type AppLocale } from "@/i18n/config";
import { getWorkspacePlanContext } from "@/features/subscriptions/data";
import { getRecentTransactions } from "@/features/transactions/data";
import { invoiceShareWhatsAppMessage } from "@/features/whatsapp/messages";
import { normalizeWhatsAppPhone } from "@/lib/whatsapp";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { after } from "next/server";

export async function DashboardHome({
  userId,
  userEmail,
  workspaceId,
  workspaceName,
  currency,
  isOwner = false,
}: {
  userId: string;
  userEmail: string;
  workspaceId: string;
  workspaceName: string;
  currency: string;
  isOwner?: boolean;
}) {
  const locale = (await getLocale()) as AppLocale;
  const moneyLocale = getIntlLocale(locale);
  const t = await getTranslations("dashboard");
  const tWhatsapp = await getTranslations("whatsapp");

  const [
    { plan },
    { balanceSummary, monthSummary, budgetWarnings, dueRecurring, receivableProjects },
    monthlyTrendResult,
    userWhatsAppPhone,
    receivablesSummary,
    recentTransactions,
    debtSummary,
    radarInvoices,
    projectsWithTotals,
  ] = await Promise.all([
    getWorkspacePlanContext(userId, workspaceId),
    getDashboardHomeData(workspaceId),
    getMonthlyTrend(workspaceId, 6, moneyLocale),
    getUserWhatsAppPhone(userId),
    getWorkspaceReceivablesSummary(workspaceId),
    getRecentTransactions(workspaceId, 5),
    getDebtSummary(workspaceId, currency),
    getOpenInvoicesRadar(workspaceId, 4),
    isOwner ? listProjectsWithTotals(workspaceId) : Promise.resolve([]),
  ]);

  const availableCashMinor =
    balanceSummary.convertedTotalMinor ?? balanceSummary.byCurrency[0]?.totalMinor ?? 0;
  const receivablesMinor = receivablesSummary.totalOutstanding;
  const debtsMinor = debtSummary.remainingLiabilities;

  const topActiveProjects = isOwner
    ? projectsWithTotals.filter((p) => p.status === "active").slice(0, 3)
    : [];

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://sanadat.site";

  after(() => {
    void Promise.all([
      dispatchDashboardEmailNotifications({
        userId,
        userEmail,
        workspaceId,
        workspaceName,
        currency,
        budgetWarnings,
        dueRecurring,
        locale,
      }),
      dispatchDashboardPushNotifications({
        userId,
        workspaceId,
        workspaceName,
        currency,
        budgetWarnings,
        dueRecurring,
        locale,
      }),
    ]).catch((error) => {
      console.error("[notifications] dashboard dispatch failed:", error);
    });
  });

  return (
    <div className="flex w-full max-w-full flex-col gap-5 sm:gap-6 overflow-x-clip">
      {/* Mobile-Only Hero Wallet Card & Quick Actions */}
      <div className="flex flex-col gap-3.5 sm:hidden">
        {/* Mobile Hero Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#064E3B] via-[#065F46] to-[#047857] p-5 text-white shadow-lg shadow-emerald-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <p className="text-xs font-semibold text-emerald-100/90 truncate">{workspaceName}</p>
            </div>
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-emerald-100 uppercase">
              {currency}
            </span>
          </div>

          <div className="mt-4">
            <p className="text-xs font-medium text-emerald-200/80">{t("totalBalance")}</p>
            <p className="mt-1 text-3xl font-extrabold tracking-tight text-white font-mono">
              {formatMoney(availableCashMinor, { currency, locale: moneyLocale })}
            </p>
            {balanceSummary.byCurrency.length > 1 && (
              <p className="mt-1 text-[11px] text-emerald-200/70 truncate">
                {balanceSummary.byCurrency
                  .map((b) => formatMoney(b.totalMinor, { currency: b.currency, locale: moneyLocale }))
                  .join(" · ")}
              </p>
            )}
          </div>

          {/* Receivables & Debts row on Mobile - OWNER ONLY */}
          {isOwner && (receivablesMinor > 0 || debtsMinor > 0) && (
            <div className="mt-3.5 rounded-2xl bg-black/25 p-3 backdrop-blur-md">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <Link href="/dashboard/invoices" prefetch={true} className="flex flex-col min-w-0">
                  <span className="text-sky-200 truncate">+{t("netPosition.receivables")}</span>
                  <span className="font-bold text-white font-mono text-xs mt-0.5 truncate">
                    {formatMoney(receivablesMinor, { currency, locale: moneyLocale })}
                  </span>
                </Link>
                <Link href="/dashboard/debts" prefetch={true} className="flex flex-col min-w-0">
                  <span className="text-amber-200 truncate">−{t("netPosition.debts")}</span>
                  <span className="font-bold text-white font-mono text-xs mt-0.5 truncate">
                    {formatMoney(debtsMinor, { currency, locale: moneyLocale })}
                  </span>
                </Link>
              </div>
            </div>
          )}

          {/* Monthly Income / Expense row */}
          <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-black/20 p-2.5 backdrop-blur-md">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-400/20 text-emerald-300">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-emerald-200/70">{t("monthIncome")}</p>
                <p className="text-xs font-bold text-white truncate font-mono">
                  {monthSummary.income == null
                    ? "-"
                    : formatMoney(monthSummary.income, { currency, locale: moneyLocale })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-rose-400/20 text-rose-300">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-emerald-200/70">{t("monthExpense")}</p>
                <p className="text-xs font-bold text-white truncate font-mono">
                  {monthSummary.expense == null
                    ? "-"
                    : formatMoney(monthSummary.expense, { currency, locale: moneyLocale })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Quick Action Buttons */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <Link
            href="/dashboard/invoices"
            prefetch={true}
            className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-[#E4DFD3] bg-white p-2.5 shadow-xs transition active:scale-95"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-[11px] font-semibold text-neutral-800 truncate w-full">{t("quickInvoice")}</span>
          </Link>

          <Link
            href="/dashboard/transactions"
            prefetch={true}
            className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-[#E4DFD3] bg-white p-2.5 shadow-xs transition active:scale-95"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
            </div>
            <span className="text-[11px] font-semibold text-neutral-800 truncate w-full">{t("quickExpense")}</span>
          </Link>

          <Link
            href="/dashboard/transactions"
            prefetch={true}
            className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-[#E4DFD3] bg-white p-2.5 shadow-xs transition active:scale-95"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </div>
            <span className="text-[11px] font-semibold text-neutral-800 truncate w-full">{t("quickIncome")}</span>
          </Link>

          <Link
            href="/dashboard/debts"
            prefetch={true}
            className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-[#E4DFD3] bg-white p-2.5 shadow-xs transition active:scale-95"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-[11px] font-semibold text-neutral-800 truncate w-full">{t("quickDebts")}</span>
          </Link>
        </div>
      </div>

      {/* Desktop Header Title & Quick Action Bar */}
      <div className="hidden sm:flex sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">{workspaceName}</h1>
          <p className="text-sm text-neutral-500">{t("workspaceSummary")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/invoices"
            prefetch={true}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#065F46] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#054d3a] transition active:scale-95"
          >
            <span>+</span>
            <span>{t("quickInvoice")}</span>
          </Link>
          <Link
            href="/dashboard/transactions"
            prefetch={true}
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 shadow-xs hover:bg-neutral-50 transition active:scale-95"
          >
            <span>+</span>
            <span>{t("quickExpense")}</span>
          </Link>
        </div>
      </div>

      {/* Financial Position Breakdown Banner (Desktop) - OWNER ONLY */}
      {isOwner && (
        <div className="hidden sm:block rounded-2xl border border-[#065F46]/20 bg-gradient-to-br from-emerald-900 via-[#065F46] to-teal-800 p-4 sm:p-5 text-white shadow-md shadow-emerald-950/10">
          <div className="grid grid-cols-3 gap-3">
            {/* 1. السيولة النقدية */}
            <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur-xs flex flex-col justify-between">
              <span className="text-xs text-emerald-200 font-bold">{t("netPosition.cash")}</span>
              <p className="text-xl sm:text-2xl font-black text-white font-mono mt-2">
                {formatMoney(availableCashMinor, { currency, locale: moneyLocale })}
              </p>
            </div>

            {/* 2. + مستحقات فواتير */}
            <Link
              href="/dashboard/invoices"
              prefetch={true}
              className="group rounded-xl bg-sky-400/15 p-3.5 backdrop-blur-xs flex flex-col justify-between transition hover:bg-sky-400/25"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-sky-200 font-bold">+{t("netPosition.receivables")}</span>
                <span className="text-xs text-sky-200/80 group-hover:underline">←</span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-sky-100 font-mono mt-2">
                {formatMoney(receivablesMinor, { currency, locale: moneyLocale })}
              </p>
            </Link>

            {/* 3. − ديون والتزامات */}
            <Link
              href="/dashboard/debts"
              prefetch={true}
              className="group rounded-xl bg-amber-400/15 p-3.5 backdrop-blur-xs flex flex-col justify-between transition hover:bg-amber-400/25"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-200 font-bold">−{t("netPosition.debts")}</span>
                <span className="text-xs text-amber-200/80 group-hover:underline">←</span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-amber-100 font-mono mt-2">
                {formatMoney(debtsMinor, { currency, locale: moneyLocale })}
              </p>
            </Link>
          </div>
        </div>
      )}

      <DashboardAlerts
        budgetWarnings={budgetWarnings}
        dueRecurring={dueRecurring}
        receivableProjects={receivableProjects}
        currency={currency}
        workspaceName={workspaceName}
        userWhatsAppPhone={userWhatsAppPhone}
        canUseWhatsApp={plan.whatsappReminders}
      />

      {/* Desktop 3-Card Summary (Accounts & Monthly Overview) */}
      <div className="hidden sm:grid sm:grid-cols-3 gap-3">
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
            <Link href="/dashboard/accounts" prefetch={true} className="mt-2 inline-block text-xs text-[#065F46] hover:underline">
              {t("manageCurrencies")}
            </Link>
          )}
        </div>
        <div className="rounded-2xl border border-[#E4DFD3] bg-white p-4 text-center shadow-sm">
          <p className="text-xs text-[#1C1B1A]/45">{t("monthIncome")}</p>
          <p className="mt-1 font-bold text-[#065F46] font-mono">
            {monthSummary.income == null
              ? t("addExchangeRates")
              : formatMoney(monthSummary.income, { currency, locale: moneyLocale })}
          </p>
        </div>
        <div className="rounded-2xl border border-[#E4DFD3] bg-white p-4 text-center shadow-sm">
          <p className="text-xs text-[#1C1B1A]/45">{t("monthExpense")}</p>
          <p className="mt-1 font-bold text-red-600 font-mono">
            {monthSummary.expense == null
              ? t("addExchangeRates")
              : formatMoney(monthSummary.expense, { currency, locale: moneyLocale })}
          </p>
        </div>
      </div>

      {/* WhatsApp Receivables Radar */}
      {plan.clientsAndProjects && radarInvoices.length > 0 && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-sky-100">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-800 text-sm">
                📲
              </span>
              <div>
                <h2 className="font-bold text-neutral-900 text-sm sm:text-base">
                  {t("radar.title")}
                </h2>
                <p className="text-xs text-neutral-500">{t("radar.subtitle")}</p>
              </div>
            </div>
            <Link href="/dashboard/invoices" prefetch={true} className="text-xs font-semibold text-sky-800 hover:underline">
              {t("receivables.viewInvoices")}
            </Link>
          </div>

          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {radarInvoices.map((inv) => {
              const whatsappText = invoiceShareWhatsAppMessage(tWhatsapp as any, {
                clientName: inv.clientName,
                invoiceNumber: inv.invoiceNumber,
                remainingLabel: formatMoney(inv.remainingAmount, { currency, locale: moneyLocale }),
                dueDateLabel: inv.dueDate
                  ? new Intl.DateTimeFormat(moneyLocale, { month: "short", day: "numeric" }).format(inv.dueDate)
                  : null,
                workspaceName,
                shareUrl: inv.shareToken
                  ? `${appBaseUrl}/i/${inv.shareToken}`
                  : `${appBaseUrl}/dashboard/invoices`,
              });
              const normPhone = inv.clientPhone ? normalizeWhatsAppPhone(inv.clientPhone) : null;
              const waUrl = normPhone
                ? `https://wa.me/${normPhone}?text=${encodeURIComponent(whatsappText)}`
                : `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

              return (
                <div
                  key={inv.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200/80 bg-white p-3 shadow-xs hover:border-sky-300 transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-neutral-900 truncate">{inv.clientName}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          inv.isOverdue ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {inv.isOverdue ? t("radar.overdueBadge") : t("radar.dueSoonBadge")}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-neutral-500 font-mono">
                      <span>#{inv.invoiceNumber}</span>
                      <span>·</span>
                      <span className="font-bold text-neutral-900">
                        {formatMoney(inv.remainingAmount, { currency, locale: moneyLocale })}
                      </span>
                    </div>
                  </div>

                  {plan.whatsappReminders ? (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition active:scale-95"
                    >
                      <span>📲</span>
                      <span className="hidden sm:inline">{t("radar.remindWhatsApp")}</span>
                    </a>
                  ) : (
                    <Link
                      href="/dashboard/plan"
                      prefetch={true}
                      className="shrink-0 rounded-lg border border-neutral-200 px-2.5 py-1 text-[11px] font-medium text-neutral-600 hover:bg-neutral-50"
                    >
                      🔒 {t("radar.remindWhatsApp")}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Owner-Only Live Projects Profitability Widget (GR-5 / Tenant Privacy) */}
      {isOwner && plan.clientsAndProjects && topActiveProjects.length > 0 && (
        <div className="rounded-2xl border border-emerald-200/80 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800 text-sm">
                📊
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-neutral-900 text-sm sm:text-base">
                    {t("ownerProfitability.title")}
                  </h2>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    {t("ownerProfitability.badge")}
                  </span>
                </div>
                <p className="text-xs text-neutral-500">{t("ownerProfitability.subtitle")}</p>
              </div>
            </div>
            <Link href="/dashboard/projects" prefetch={true} className="text-xs font-semibold text-[#065F46] hover:underline">
              {t("ownerProfitability.viewAllProjects")}
            </Link>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {topActiveProjects.map((project) => {
              const margin = project.profitMargin;
              return (
                <div
                  key={project._id}
                  className="flex flex-col justify-between rounded-xl border border-neutral-100 bg-[#FBF9F4] p-3.5 hover:border-emerald-300 transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-sm text-neutral-900 truncate">{project.name}</p>
                      {margin != null && (
                        <span
                          className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-mono font-bold ${
                            margin >= 50
                              ? "bg-emerald-100 text-emerald-800"
                              : margin > 0
                                ? "bg-teal-100 text-teal-800"
                                : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {margin}% {t("ownerProfitability.profitMargin")}
                        </span>
                      )}
                    </div>
                    {project.clientName && (
                      <p className="text-xs text-neutral-400 truncate mt-0.5">{project.clientName}</p>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-neutral-200/60">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500">{t("ownerProfitability.netProfit")}</span>
                      <span
                        className={`font-mono font-bold ${
                          project.netProfit >= 0 ? "text-emerald-800" : "text-rose-700"
                        }`}
                      >
                        {project.netProfit >= 0 ? "+" : ""}
                        {formatMoney(project.netProfit, { currency, locale: moneyLocale })}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                      <span>
                        {t("ownerProfitability.revenue")}: {formatMoney(project.incomeTotal, { currency, locale: moneyLocale })}
                      </span>
                      <span>
                        {t("ownerProfitability.cost")}: {formatMoney(project.expenseTotal, { currency, locale: moneyLocale })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Activity Feed */}
      <div className="rounded-2xl border border-[#E4DFD3] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <h2 className="font-bold text-neutral-900 text-sm sm:text-base flex items-center gap-2">
            <span>📋</span>
            <span>{t("recentTransactions")}</span>
          </h2>
          <Link
            href="/dashboard/transactions"
            prefetch={true}
            className="text-xs font-semibold text-[#065F46] hover:underline"
          >
            {t("viewAllTransactions")}
          </Link>
        </div>
        {recentTransactions.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400">
            {t("noRecentTransactions")}
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {recentTransactions.map((tx) => (
              <div key={tx._id} className="flex items-center justify-between py-3 gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm ${
                      tx.type === "income"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {tx.categoryIcon ? tx.categoryIcon : tx.type === "income" ? "↓" : "↑"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs sm:text-sm font-semibold text-neutral-800">
                      {tx.description ||
                        tx.categoryName ||
                        (tx.type === "income" ? t("quickIncome") : t("quickExpense"))}
                    </p>
                    <p className="text-[11px] text-neutral-400 truncate">
                      {new Intl.DateTimeFormat(moneyLocale, {
                        month: "short",
                        day: "numeric",
                      }).format(new Date(tx.transactionDate))}
                      {tx.accountName ? ` · ${tx.accountName}` : ""}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs sm:text-sm font-bold font-mono shrink-0 ${
                    tx.type === "income" ? "text-emerald-700" : "text-neutral-900"
                  }`}
                >
                  {tx.type === "income" ? "+" : "-"}
                  {formatMoney(tx.amount, { currency, locale: moneyLocale })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <MonthlyTrendChart
        months={monthlyTrendResult.months}
        currency={currency}
        moneyLocale={moneyLocale}
      />

      {/* Navigation Quick Links */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/dashboard/transactions"
          prefetch={true}
          className="rounded-2xl border border-[#E4DFD3] bg-white p-5 shadow-sm transition hover:border-[#065F46]/30"
        >
          <h2 className="font-semibold text-neutral-900">{t("transactionsTitle")}</h2>
          <p className="mt-1 text-sm text-neutral-500">{t("transactionsDesc")}</p>
        </Link>

        <Link
          href="/dashboard/accounts"
          prefetch={true}
          className="rounded-2xl border border-[#E4DFD3] bg-white p-5 shadow-sm transition hover:border-[#065F46]/30"
        >
          <h2 className="font-semibold text-neutral-900">{t("accountsTitle")}</h2>
          <p className="mt-1 text-sm text-neutral-500">{t("accountsDesc")}</p>
        </Link>

        <Link
          href="/dashboard/budgets"
          prefetch={true}
          className="rounded-2xl border border-[#E4DFD3] bg-white p-5 shadow-sm transition hover:border-[#065F46]/30"
        >
          <h2 className="font-semibold text-neutral-900">{t("budgetsTitle")}</h2>
          <p className="mt-1 text-sm text-neutral-500">{t("budgetsDesc")}</p>
        </Link>

        <Link
          href="/dashboard/reports"
          prefetch={true}
          className="rounded-2xl border border-[#E4DFD3] bg-white p-5 shadow-sm transition hover:border-[#065F46]/30"
        >
          <h2 className="font-semibold text-neutral-900">{t("reportsTitle")}</h2>
          <p className="mt-1 text-sm text-neutral-500">{t("reportsDesc")}</p>
        </Link>
      </div>
    </div>
  );
}

export function DashboardHomeSkeleton() {
  return (
    <div className="flex w-full max-w-full flex-col gap-6 overflow-x-clip">
      <div className="h-12 w-48 animate-pulse rounded-lg bg-[#E4DFD3]/70" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="h-24 animate-pulse rounded-2xl bg-[#E4DFD3]/50" />
        <div className="h-24 animate-pulse rounded-2xl bg-[#E4DFD3]/50" />
        <div className="h-24 animate-pulse rounded-2xl bg-[#E4DFD3]/50" />
      </div>
      <div className="h-56 animate-pulse rounded-2xl bg-[#E4DFD3]/40" />
    </div>
  );
}
