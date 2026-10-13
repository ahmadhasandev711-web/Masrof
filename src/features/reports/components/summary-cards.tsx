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
    <span className="text-sm font-medium text-amber-700">{tConversion("unavailable")}</span>
  );

  const isProfitable = net != null && net >= 0;
  const savingsPercent =
    income != null && income > 0 && net != null
      ? Math.round((net / income) * 100)
      : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* 1. Total Income */}
      <div className="flex flex-col justify-between rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 to-emerald-100/40 p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-emerald-900">{tSummary("totalIncome")}</p>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-xs text-emerald-700 font-bold">
            ↗️
          </span>
        </div>
        <div className="mt-2">
          <p className="truncate text-xl sm:text-2xl font-bold text-emerald-950 font-mono tabular-nums">
            {income == null ? unavailable : formatMoney(income, { currency })}
          </p>
        </div>
      </div>

      {/* 2. Total Expense */}
      <div className="flex flex-col justify-between rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-50/70 to-rose-100/40 p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-rose-900">{tSummary("totalExpense")}</p>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-xs text-rose-700 font-bold">
            ↘️
          </span>
        </div>
        <div className="mt-2">
          <p className="truncate text-xl sm:text-2xl font-bold text-rose-950 font-mono tabular-nums">
            {expense == null ? unavailable : formatMoney(expense, { currency })}
          </p>
        </div>
      </div>

      {/* 3. Net / Savings Rate */}
      <div
        className={`flex flex-col justify-between rounded-2xl border p-4 shadow-xs ${
          isProfitable
            ? "border-teal-200/80 bg-gradient-to-br from-teal-50/70 to-teal-100/40"
            : "border-amber-200/80 bg-gradient-to-br from-amber-50/70 to-amber-100/40"
        }`}
      >
        <div className="flex items-center justify-between">
          <p className={`text-xs font-semibold ${isProfitable ? "text-teal-900" : "text-amber-900"}`}>
            {tSummary("net")}
          </p>
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${
              isProfitable ? "bg-teal-500/10 text-teal-700" : "bg-amber-500/10 text-amber-700"
            }`}
          >
            {isProfitable ? "✓" : "⚠️"}
          </span>
        </div>
        <div className="mt-2">
          <p
            className={`truncate text-xl sm:text-2xl font-bold font-mono tabular-nums ${
              isProfitable ? "text-teal-950" : "text-rose-700"
            }`}
          >
            {net == null ? unavailable : formatMoney(net, { currency })}
          </p>
          {savingsPercent != null && (
            <p
              className={`mt-1 text-[11px] truncate font-medium ${
                isProfitable ? "text-teal-700" : "text-amber-800"
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
