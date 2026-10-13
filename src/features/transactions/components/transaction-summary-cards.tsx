import { formatMoney } from "@/lib/money";

export function TransactionSummaryCards({
  totalIncome,
  totalExpense,
  net,
  totalCount,
  currency = "EGP",
}: {
  totalIncome: number;
  totalExpense: number;
  net: number;
  totalCount: number;
  currency?: string;
}) {
  const isNetPositive = net >= 0;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {/* 1. Total Income */}
      <div className="flex items-center justify-between rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 to-emerald-100/40 p-4 shadow-xs">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-emerald-800">إجمالي الإيرادات</p>
          <p className="mt-1 truncate text-lg font-bold text-emerald-950 sm:text-xl">
            {formatMoney(totalIncome, { currency })}
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>

      {/* 2. Total Expense */}
      <div className="flex items-center justify-between rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-50/70 to-rose-100/40 p-4 shadow-xs">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-rose-800">إجمالي المصروفات</p>
          <p className="mt-1 truncate text-lg font-bold text-rose-950 sm:text-xl">
            {formatMoney(totalExpense, { currency })}
          </p>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-700">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </div>
      </div>

      {/* 3. Net Balance */}
      <div
        className={`flex items-center justify-between rounded-2xl border p-4 shadow-xs ${
          isNetPositive
            ? "border-teal-200/80 bg-gradient-to-br from-teal-50/70 to-teal-100/40"
            : "border-amber-200/80 bg-gradient-to-br from-amber-50/70 to-amber-100/40"
        }`}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className={`text-xs font-semibold ${isNetPositive ? "text-teal-800" : "text-amber-800"}`}>
              صافي الحركة
            </p>
            <span className="rounded-full bg-black/5 px-1.5 py-0.2 text-[10px] font-bold text-neutral-600">
              {totalCount} عملية
            </span>
          </div>
          <p
            className={`mt-1 truncate text-lg font-bold sm:text-xl ${
              isNetPositive ? "text-teal-950" : "text-amber-950"
            }`}
          >
            {formatMoney(net, { currency })}
          </p>
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            isNetPositive ? "bg-teal-500/10 text-teal-700" : "bg-amber-500/10 text-amber-700"
          }`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
