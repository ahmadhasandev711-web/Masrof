"use client";

import { useTranslations, useLocale } from "next-intl";
import { formatMoney } from "@/lib/money";
import type { DebtSummary } from "@/features/debts/types";

export function DebtsSummaryCards({ summary }: { summary: DebtSummary }) {
  const t = useTranslations("forms.debts");
  const locale = useLocale();
  const formatOptions = {
    currency: summary.currency,
    locale: locale === "ar" ? "ar-EG" : "en-US",
  };

  const percentRepaid =
    summary.totalLiabilities > 0
      ? Math.min(100, Math.round((summary.totalPaid / summary.totalLiabilities) * 100))
      : 0;

  return (
    <>
      {/* Mobile-Optimized Compact Hero Liability Card (Under ~130px) */}
      <div className="flex flex-col justify-between rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800 p-4 text-white shadow-sm sm:hidden">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-neutral-300">
                {t("remainingLiabilities")}
              </span>
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                {t("dueBadge")}
              </span>
            </div>
            <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-400">
              {percentRepaid}%
            </span>
          </div>

          <p className="mt-1.5 text-2xl font-bold tracking-tight text-white">
            {formatMoney(summary.remainingLiabilities, formatOptions)}
          </p>
        </div>

        {/* Repayment Progress Bar */}
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-700">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${percentRepaid}%` }}
            />
          </div>

          {/* 2-Column Split: Total Liabilities & Total Paid */}
          <div className="mt-2.5 flex items-center justify-between border-t border-neutral-700/60 pt-2 text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-neutral-400 truncate">{t("totalLiabilities")}:</span>
              <span className="font-semibold text-neutral-200">
                {formatMoney(summary.totalLiabilities, formatOptions)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-neutral-400 truncate">{t("totalPaid")}:</span>
              <span className="font-semibold text-emerald-400">
                {formatMoney(summary.totalPaid, formatOptions)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop 3-Card Grid */}
      <div className="hidden sm:grid sm:grid-cols-3 sm:gap-4">
        {/* Total Liabilities */}
        <div className="rounded-xl border border-neutral-200/80 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500">{t("totalLiabilities")}</span>
            <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-700">
              {t("debtsCount", { count: summary.activeCount + summary.paidCount })}
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-neutral-900">
            {formatMoney(summary.totalLiabilities, formatOptions)}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {t("activeAndPaidSummary", { active: summary.activeCount, paid: summary.paidCount })}
          </p>
        </div>

        {/* Paid So Far */}
        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-800">{t("totalPaid")}</span>
            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900">
              {percentRepaid}%
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-900">
            {formatMoney(summary.totalPaid, formatOptions)}
          </p>
          <p className="mt-1 text-xs text-emerald-700">
            {t("autoExpenseNote")}
          </p>
        </div>

        {/* Remaining Liabilities */}
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-900">{t("remainingLiabilities")}</span>
            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
              {t("dueBadge")}
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-amber-900">
            {formatMoney(summary.remainingLiabilities, formatOptions)}
          </p>
          <p className="mt-1 text-xs text-amber-700">
            {t("remainingNote")}
          </p>
        </div>
      </div>
    </>
  );
}
