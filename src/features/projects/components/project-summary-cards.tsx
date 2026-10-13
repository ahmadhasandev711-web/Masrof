"use client";

import { formatMoney } from "@/lib/money";
import { useTranslations } from "next-intl";

export function ProjectSummaryCards({
  totalProjects,
  inProgressCount,
  completedCount,
  totalInvoiced,
  totalNetProfit,
  totalExpectedProfit,
  currency = "EGP",
}: {
  totalProjects: number;
  inProgressCount: number;
  completedCount: number;
  totalInvoiced: number;
  totalNetProfit: number;
  totalExpectedProfit?: number;
  currency?: string;
}) {
  const t = useTranslations("pages.projects");

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
      {/* 1. In Progress */}
      <div className="flex flex-col justify-between rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/70 to-blue-100/40 p-3.5 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-blue-900">{t("inProgressProjects")}</p>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-xs text-blue-700">
            ⏳
          </span>
        </div>
        <p className="mt-2 truncate text-base font-bold text-blue-950 sm:text-xl">
          {inProgressCount}{" "}
          <span className="text-xs font-normal text-blue-700">
            {t("outOf", { total: totalProjects })}
          </span>
        </p>
      </div>

      {/* 2. Completed */}
      <div className="flex flex-col justify-between rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 to-emerald-100/40 p-3.5 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-emerald-900">{t("completedProjects")}</p>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-xs text-emerald-700">
            ✓
          </span>
        </div>
        <p className="mt-2 truncate text-base font-bold text-emerald-950 sm:text-xl">
          {completedCount}{" "}
          <span className="text-xs font-normal text-emerald-700">
            {t("projectsCountUnit")}
          </span>
        </p>
      </div>

      {/* 3. Total Invoiced on projects */}
      <div className="flex flex-col justify-between rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/70 to-indigo-100/40 p-3.5 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-indigo-900">{t("totalInvoiced")}</p>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-xs text-indigo-700">
            🧾
          </span>
        </div>
        <p className="mt-2 truncate text-base font-bold text-indigo-950 sm:text-xl">
          {formatMoney(totalInvoiced, { currency })}
        </p>
      </div>

      {/* 4. Total Net Profit */}
      <div className="flex flex-col justify-between rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 to-emerald-100/40 p-3.5 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-emerald-900">{t("netProjectsProfit")}</p>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-xs text-emerald-700">
            📈
          </span>
        </div>
        <div>
          <p
            className={`mt-2 truncate text-base font-bold sm:text-xl ${
              totalNetProfit >= 0 ? "text-emerald-950" : "text-rose-700"
            }`}
          >
            {formatMoney(totalNetProfit, { currency })}
          </p>
          {totalExpectedProfit != null && totalExpectedProfit > totalNetProfit && (
            <p className="text-[10px] text-neutral-500 mt-0.5">
              {t("expectedUponPayment")}:{" "}
              <span className="font-semibold text-emerald-700">
                {formatMoney(totalExpectedProfit, { currency })}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
