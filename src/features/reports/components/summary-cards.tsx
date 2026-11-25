import { formatMoney } from "@/lib/money";
import { getTranslations } from "next-intl/server";

export async function ReportSummaryCards({
  income,
  expense,
  net,
  currency,
}: {
  income: number | null;
  expense: number | null;
  net: number | null;
  currency: string;
}) {
  const [tSummary, tConversion, tPages] = await Promise.all([
    getTranslations("reports.summary"),
    getTranslations("reports.conversion"),
    getTranslations("pages.reports"),
  ]);

  const unavailable = (
    <span className="text-sm font-medium text-amber-700 dark:text-amber-300">{tConversion("unavailable")}</span>
  );

  const isProfitable = net != null && net >= 0;
  const savingsPercent =
    income != null && income > 0 && net != null
      ? Math.round((net / income) * 100)
      : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* 1. Total Income */}
      <div className="flex flex-col justify-between rounded-2xl border border-emerald-200/80 dark:border-emerald-500/25 bg-gradient-to-br from-emerald-50/70 to-emerald-100/40 dark:from-[#0F2E24] dark:to-[#161E1B] p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-emerald-900 dark:text-[#34D399]">{tSummary("totalIncome")}</p>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 dark:bg-[#34D399]/15 text-xs text-emerald-700 dark:text-[#34D399] font-bold">
            ↗
          </span>
        </div>
        <div className="mt-2">
          <p className="truncate text-xl sm:text-2xl font-bold text-emerald-950 dark:text-[#ECEAE4] font-mono tabular-nums">
            {income == null ? unavailable : formatMoney(income, { currency })}
          </p>
        </div>
      </div>

      {/* 2. Total Expense */}
      <div className="flex flex-col justify-between rounded-2xl border border-rose-200/80 dark:border-rose-500/25 bg-gradient-to-br from-rose-50/70 to-rose-100/40 dark:from-rose-950/35 dark:to-[#161E1B] p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-rose-900 dark:text-rose-300">{tSummary("totalExpense")}</p>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 dark:bg-rose-500/20 text-xs text-rose-700 dark:text-rose-400 font-bold">
            ↘
          </span>
        </div>
        <div className="mt-2">
          <p className="truncate text-xl sm:text-2xl font-bold text-rose-950 dark:text-[#ECEAE4] font-mono tabular-nums">
            {expense == null ? unavailable : formatMoney(expense, { currency })}
          </p>
        </div>
      </div>

      {/* 3. Net / Savings Rate */}
      <div
        className={`flex flex-col justify-between rounded-2xl border p-4 shadow-xs ${
          isProfitable
            ? "border-teal-200/80 dark:border-teal-500/25 bg-gradient-to-br from-teal-50/70 to-teal-100/40 dark:from-teal-950/35 dark:to-[#161E1B]"
            : "border-amber-200/80 dark:border-amber-500/25 bg-gradient-to-br from-amber-50/70 to-amber-100/40 dark:from-amber-950/35 dark:to-[#161E1B]"
        }`}
      >
        <div className="flex items-center justify-between">
          <p className={`text-xs font-semibold ${isProfitable ? "text-teal-900 dark:text-teal-300" : "text-amber-900 dark:text-amber-300"}`}>
            {tSummary("net")}
          </p>
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
              isProfitable ? "bg-teal-500/10 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300" : "bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300"
            }`}
          >
            {isProfitable ? "" : ""}
          </span>
        </div>
        <div className="mt-2">
          <p
            className={`truncate text-xl sm:text-2xl font-bold font-mono tabular-nums ${
              isProfitable ? "text-teal-950 dark:text-[#ECEAE4]" : "text-rose-700 dark:text-rose-400"
            }`}
          >
            {net == null ? unavailable : formatMoney(net, { currency })}
          </p>
          {savingsPercent != null && (
            <p
              className={`mt-1 text-[11px] truncate font-medium ${
                isProfitable ? "text-teal-700 dark:text-teal-300" : "text-amber-800 dark:text-amber-300"
              }`}
            >
              {isProfitable
                ? tPages("savingsPositive", { percent: savingsPercent })
                : tPages("deficitNotice", { percent: Math.abs(savingsPercent) })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
