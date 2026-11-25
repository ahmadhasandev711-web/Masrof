"use client";

import { useTranslations } from "next-intl";

type Props = {
  plan: "free" | "pro";
  invoicesThisMonth: number;
  clientsCount: number;
  membersCount: number;
  limits: {
    maxInvoicesPerMonth: number;
    maxClients: number;
    maxMembers: number;
  };
  isLimitReached: boolean;
};

export function WorkspaceUsageRadar({
  plan,
  invoicesThisMonth,
  clientsCount,
  membersCount,
  limits,
  isLimitReached,
}: Props) {
  const t = useTranslations("admin.workspaces");

  const invoiceLimitDisplay = limits.maxInvoicesPerMonth === -1 ? t("unlimited") : limits.maxInvoicesPerMonth;
  const invoicePercent =
    limits.maxInvoicesPerMonth === -1
      ? 0
      : Math.min(100, Math.round((invoicesThisMonth / limits.maxInvoicesPerMonth) * 100));

  const clientLimitDisplay = limits.maxClients === -1 ? t("unlimited") : limits.maxClients;
  const clientPercent =
    limits.maxClients === -1
      ? 0
      : Math.min(100, Math.round((clientsCount / limits.maxClients) * 100));

  return (
    <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs dark:border-[#26302C] dark:bg-[#161E1B]">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-[#26302C]">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-100 text-violet-800 text-sm dark:bg-violet-950/40 dark:text-violet-300">
            📊
          </span>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-[#ECEAE4]">{t("usageQuotaTitle")}</h3>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
            plan === "pro"
              ? "bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300"
              : isLimitReached
                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                : "bg-neutral-100 text-neutral-700 dark:bg-[#1E2824] dark:text-[#ECEAE4]"
          }`}
        >
          {plan.toUpperCase()}
        </span>
      </div>

      {isLimitReached && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs font-semibold text-amber-900 dark:border-amber-800/40 dark:bg-amber-950/25 dark:text-amber-300">
          {t("limitReachedAlert")}
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {/* Invoices */}
        <div className="rounded-xl border border-neutral-100 bg-[#FBF9F4] p-3 dark:border-[#26302C] dark:bg-[#1E2824]">
          <div className="flex items-center justify-between text-xs font-medium text-neutral-600 dark:text-[#9AA39F]">
            <span>فواتير هذا الشهر</span>
            <span className="font-mono font-bold text-neutral-900 dark:text-[#ECEAE4]">
              {invoicesThisMonth} / {invoiceLimitDisplay}
            </span>
          </div>
          {limits.maxInvoicesPerMonth !== -1 && (
            <div className="mt-2 h-1.5 w-full rounded-full bg-neutral-200 overflow-hidden dark:bg-[#26302C]">
              <div
                className={`h-full transition-all ${
                  invoicePercent >= 100
                    ? "bg-rose-500"
                    : invoicePercent >= 80
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                }`}
                style={{ width: `${invoicePercent}%` }}
              />
            </div>
          )}
        </div>

        {/* Clients */}
        <div className="rounded-xl border border-neutral-100 bg-[#FBF9F4] p-3 dark:border-[#26302C] dark:bg-[#1E2824]">
          <div className="flex items-center justify-between text-xs font-medium text-neutral-600 dark:text-[#9AA39F]">
            <span>العملاء</span>
            <span className="font-mono font-bold text-neutral-900 dark:text-[#ECEAE4]">
              {clientsCount} / {clientLimitDisplay}
            </span>
          </div>
          {limits.maxClients !== -1 && (
            <div className="mt-2 h-1.5 w-full rounded-full bg-neutral-200 overflow-hidden dark:bg-[#26302C]">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${clientPercent}%` }}
              />
            </div>
          )}
        </div>

        {/* Members */}
        <div className="rounded-xl border border-neutral-100 bg-[#FBF9F4] p-3 dark:border-[#26302C] dark:bg-[#1E2824]">
          <div className="flex items-center justify-between text-xs font-medium text-neutral-600 dark:text-[#9AA39F]">
            <span>فريق العمل</span>
            <span className="font-mono font-bold text-neutral-900 dark:text-[#ECEAE4]">
              {membersCount} / {limits.maxMembers === -1 ? t("unlimited") : limits.maxMembers}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
