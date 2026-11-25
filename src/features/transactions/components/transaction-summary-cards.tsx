import { formatMoney } from "@/lib/money";
import { useLocale, useTranslations } from "next-intl";

export function TransactionSummaryCards({
  totalIncome,
  totalExpense,
  net,
  totalCount,
  currency,
}: {
  totalIncome: number;
  totalExpense: number;
  net: number;
  totalCount: number;
  currency: string;
}) {
  const t = useTranslations("pages.transactions");
  const locale = useLocale();
  const isNetPositive = net >= 0;

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
      {/* 1. Total Income */}
      <div className="flex flex-col justify-between rounded-2xl border border-emerald-200/80 dark:border-emerald-500/25 bg-gradient-to-br from-emerald-50/70 to-emerald-100/40 dark:from-[#0F2E24] dark:to-[#161E1B] p-3 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-[11px] sm:text-xs font-semibold text-emerald-800 dark:text-[#34D399] truncate">{t("totalIncome")}</p>
          <span className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-emerald-500/15 dark:bg-[#34D399]/15 text-emerald-700 dark:text-[#34D399] text-xs">
            ↓
          </span>
        </div>
        <p className="mt-2 truncate font-mono text-sm sm:text-xl font-bold tabular-nums text-emerald-950 dark:text-[#ECEAE4]">
          +{formatMoney(totalIncome, { currency, locale })}
        </p>
      </div>

      {/* 2. Total Expense */}
      <div className="flex flex-col justify-between rounded-2xl border border-rose-200/80 dark:border-rose-500/25 bg-gradient-to-br from-rose-50/70 to-rose-100/40 dark:from-rose-950/35 dark:to-[#161E1B] p-3 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-[11px] sm:text-xs font-semibold text-rose-800 dark:text-rose-400 truncate">{t("totalExpense")}</p>
          <span className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-rose-500/15 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 text-xs">
            ↑
          </span>
        </div>
        <p className="mt-2 truncate font-mono text-sm sm:text-xl font-bold tabular-nums text-rose-950 dark:text-[#ECEAE4]">
          -{formatMoney(totalExpense, { currency, locale })}
        </p>
      </div>

      {/* 3. Net Balance (Spans 2 columns on mobile, 1 on desktop) */}
      <div
        className={`col-span-2 sm:col-span-1 flex flex-col justify-between rounded-2xl border p-3 sm:p-4 shadow-xs ${
          isNetPositive
            ? "border-teal-200/80 dark:border-teal-500/25 bg-gradient-to-br from-teal-50/70 to-teal-100/40 dark:from-teal-950/35 dark:to-[#161E1B]"
            : "border-amber-200/80 dark:border-amber-500/25 bg-gradient-to-br from-amber-50/70 to-amber-100/40 dark:from-amber-950/35 dark:to-[#161E1B]"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <p className={`text-[11px] sm:text-xs font-semibold truncate ${isNetPositive ? "text-teal-800 dark:text-teal-300" : "text-amber-800 dark:text-amber-300"}`}>
              {t("net")}
            </p>
            <span className="rounded-full bg-black/5 dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-neutral-600 dark:text-[#9AA39F]">
              {totalCount} {t("operations")}
            </span>
          </div>
          <span
            className={`flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-xs font-bold ${
              isNetPositive ? "bg-teal-500/15 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300" : "bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300"
            }`}
          >
            {isNetPositive ? "↑" : "↓"}
          </span>
        </div>
        <p
          className={`mt-2 truncate font-mono text-sm sm:text-xl font-bold tabular-nums ${
            isNetPositive ? "text-teal-950 dark:text-[#ECEAE4]" : "text-amber-950 dark:text-[#ECEAE4]"
          }`}
        >
          {formatMoney(net, { currency, locale })}
        </p>
      </div>
    </div>
  );
}
