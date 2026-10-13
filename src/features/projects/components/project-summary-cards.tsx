import { formatMoney } from "@/lib/money";

export function ProjectSummaryCards({
  totalProjects,
  inProgressCount,
  completedCount,
  totalInvoiced,
  totalNetProfit,
  currency = "EGP",
}: {
  totalProjects: number;
  inProgressCount: number;
  completedCount: number;
  totalInvoiced: number;
  totalNetProfit: number;
  currency?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
      {/* 1. In Progress */}
      <div className="flex flex-col justify-between rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/70 to-blue-100/40 p-3.5 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-blue-900">مشاريع قيد التنفيذ</p>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-xs text-blue-700">
            ⏳
          </span>
        </div>
        <p className="mt-2 truncate text-base font-bold text-blue-950 sm:text-xl">
          {inProgressCount} <span className="text-xs font-normal text-blue-700">من {totalProjects}</span>
        </p>
      </div>

      {/* 2. Completed */}
      <div className="flex flex-col justify-between rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 to-emerald-100/40 p-3.5 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-emerald-900">مشاريع مكتملة</p>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-xs text-emerald-700">
            ✓
          </span>
        </div>
        <p className="mt-2 truncate text-base font-bold text-emerald-950 sm:text-xl">
          {completedCount} <span className="text-xs font-normal text-emerald-700">مشروع</span>
        </p>
      </div>

      {/* 3. Total Invoiced on projects */}
      <div className="flex flex-col justify-between rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/70 to-indigo-100/40 p-3.5 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-indigo-900">إجمالي المفوتر</p>
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
          <p className="text-xs font-semibold text-emerald-900">صافي أرباح المشاريع</p>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-xs text-emerald-700">
            📈
          </span>
        </div>
        <p className={`mt-2 truncate text-base font-bold sm:text-xl ${totalNetProfit >= 0 ? "text-emerald-950" : "text-red-700"}`}>
          {formatMoney(totalNetProfit, { currency })}
        </p>
      </div>
    </div>
  );
}
