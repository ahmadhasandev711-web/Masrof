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
      <div className="flex flex-col justify-between rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 to-emerald-100/40 p-3 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-[11px] sm:text-xs font-semibold text-emerald-800 truncate">{t("totalIncome")}</p>
          <span className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-700 text-xs">
            ↓
          </span>
        </div>
        <p className="mt-2 truncate font-mono text-sm sm:text-xl font-bold tabular-nums text-emerald-950">
          +{formatMoney(totalIncome, { currency, locale })}
        </p>
      </div>

      {/* 2. Total Expense */}
      <div className="flex flex-col justify-between rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-50/70 to-rose-100/40 p-3 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-[11px] sm:text-xs font-semibold text-rose-800 truncate">{t("totalExpense")}</p>
          <span className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-rose-500/15 text-rose-700 text-xs">
            ↑
          </span>
        </div>
        <p className="mt-2 truncate font-mono text-sm sm:text-xl font-bold tabular-nums text-rose-950">
          -{formatMoney(totalExpense, { currency, locale })}
        </p>
      </div>

      {/* 3. Net Balance (Spans 2 columns on mobile, 1 on desktop) */}
      <div
        className={`col-span-2 sm:col-span-1 flex flex-col justify-between rounded-2xl border p-3 sm:p-4 shadow-xs ${
          isNetPositive
            ? "border-teal-200/80 bg-gradient-to-br from-teal-50/70 to-teal-100/40"
            : "border-amber-200/80 bg-gradient-to-br from-amber-50/70 to-amber-100/40"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <p className={`text-[11px] sm:text-xs font-semibold truncate ${isNetPositive ? "text-teal-800" : "text-amber-800"}`}>
              {t("net")}
            </p>
            <span className="rounded-full bg-black/5 px-1.5 py-0.5 text-[10px] font-bold text-neutral-600">
              {totalCount} {t("operations")}
            </span>
          </div>
          <span
            className={`flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-lg text-xs font-bold ${
              isNetPositive ? "bg-teal-500/15 text-teal-700" : "bg-amber-500/15 text-amber-700"
            }`}
          >
            {isNetPositive ? "↑" : "↓"}
          </span>
        </div>
        <p
          className={`mt-2 truncate font-mono text-sm sm:text-xl font-bold tabular-nums ${
            isNetPositive ? "text-teal-950" : "text-amber-950"
          }`}
        >
          {formatMoney(net, { currency, locale })}
        </p>
      </div>
    </div>
  );
}
