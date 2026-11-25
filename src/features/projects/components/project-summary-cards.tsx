"use client";

import { formatMoney } from "@/lib/money";
import { useLocale, useTranslations } from "next-intl";

export function ProjectSummaryCards({
  totalProjects,
  inProgressCount,
  completedCount,
  totalInvoiced,
  totalNetProfit,
  totalExpectedProfit,
  currency,
}: {
  totalProjects: number;
  inProgressCount: number;
  completedCount: number;
  totalInvoiced: number;
  totalNetProfit: number;
  totalExpectedProfit?: number;
  currency: string;
}) {
  const t = useTranslations("pages.projects");
  const locale = useLocale();

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
      {/* 1. In Progress */}
      <div className="flex flex-col justify-between rounded-2xl border border-blue-200/80 dark:border-blue-500/25 bg-gradient-to-br from-blue-50/70 to-blue-100/40 dark:from-blue-950/35 dark:to-[#161E1B] p-3.5 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-blue-900 dark:text-blue-300">{t("inProgressProjects")}</p>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-xs text-blue-700 dark:text-blue-300">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
        </div>
        <p className="mt-2 truncate text-base font-bold text-blue-950 dark:text-[#ECEAE4] sm:text-xl">
          {inProgressCount}{" "}
          <span className="text-xs font-normal text-blue-700 dark:text-blue-300">
            {t("outOf", { total: totalProjects })}
          </span>
        </p>
      </div>

      {/* 2. Completed */}
      <div className="flex flex-col justify-between rounded-2xl border border-emerald-200/80 dark:border-emerald-500/25 bg-gradient-to-br from-emerald-50/70 to-emerald-100/40 dark:from-[#0F2E24] dark:to-[#161E1B] p-3.5 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-emerald-900 dark:text-[#34D399]">{t("completedProjects")}</p>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 dark:bg-[#34D399]/15 text-xs text-emerald-700 dark:text-[#34D399]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
        </div>
        <p className="mt-2 truncate text-base font-bold text-emerald-950 dark:text-[#ECEAE4] sm:text-xl">
          {completedCount}{" "}
          <span className="text-xs font-normal text-emerald-700 dark:text-[#34D399]">
            {t("projectsCountUnit")}
          </span>
        </p>
      </div>

      {/* 3. Total Invoiced on projects */}
      <div className="flex flex-col justify-between rounded-2xl border border-indigo-200/80 dark:border-indigo-500/25 bg-gradient-to-br from-indigo-50/70 to-indigo-100/40 dark:from-indigo-950/35 dark:to-[#161E1B] p-3.5 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-indigo-900 dark:text-indigo-300">{t("totalInvoiced")}</p>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-xs text-indigo-700 dark:text-indigo-300">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </span>
        </div>
        <p className="mt-2 truncate text-base font-bold text-indigo-950 dark:text-[#ECEAE4] sm:text-xl">
          {formatMoney(totalInvoiced, { currency, locale })}
        </p>
      </div>

      {/* 4. Total Net Profit */}
      <div className="flex flex-col justify-between rounded-2xl border border-emerald-200/80 dark:border-emerald-500/25 bg-gradient-to-br from-emerald-50/70 to-emerald-100/40 dark:from-[#0F2E24] dark:to-[#161E1B] p-3.5 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-emerald-900 dark:text-[#34D399]">{t("netProjectsProfit")}</p>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 dark:bg-[#34D399]/15 text-xs text-emerald-700 dark:text-[#34D399]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </span>
        </div>
        <div>
          <p
            className={`mt-2 truncate text-base font-bold sm:text-xl ${
              totalNetProfit >= 0 ? "text-emerald-950 dark:text-[#ECEAE4]" : "text-rose-700 dark:text-rose-400"
            }`}
          >
            {formatMoney(totalNetProfit, { currency, locale })}
          </p>
          {totalExpectedProfit != null && totalExpectedProfit > totalNetProfit && (
            <p className="text-[10px] text-neutral-500 dark:text-[#9AA39F] mt-0.5">
              {t("expectedUponPayment")}:{" "}
              <span className="font-semibold text-emerald-700 dark:text-[#34D399]">
                {formatMoney(totalExpectedProfit, { currency, locale })}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
