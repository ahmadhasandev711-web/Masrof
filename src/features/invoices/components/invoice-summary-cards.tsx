import { formatMoney } from "@/lib/money";
import { useLocale, useTranslations } from "next-intl";

export function InvoiceSummaryCards({
  totalInvoiced,
  totalPaid,
  totalRemaining,
  totalOverdue,
  totalCount,
  currency = "EGP",
}: {
  totalInvoiced: number;
  totalPaid: number;
  totalRemaining: number;
  totalOverdue: number;
  totalCount: number;
  currency?: string;
}) {
  const t = useTranslations("pages.invoices");
  const locale = useLocale();

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
      {/* 1. Total Invoiced */}
      <div className="flex flex-col justify-between rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/70 to-indigo-100/40 p-3.5 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-indigo-900">{t("totalInvoiced")}</p>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-xs text-indigo-700">
            🧾
          </span>
        </div>
        <p className="mt-2 truncate text-base font-bold text-indigo-950 sm:text-xl">
          {formatMoney(totalInvoiced, { currency, locale })}
        </p>
      </div>

      {/* 2. Total Paid */}
      <div className="flex flex-col justify-between rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 to-emerald-100/40 p-3.5 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-emerald-900">{t("totalPaid")}</p>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-xs text-emerald-700">
            ✓
          </span>
        </div>
        <p className="mt-2 truncate text-base font-bold text-emerald-950 sm:text-xl">
          {formatMoney(totalPaid, { currency, locale })}
        </p>
      </div>

      {/* 3. Total Remaining */}
      <div className="flex flex-col justify-between rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 to-amber-100/40 p-3.5 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-amber-900">{t("totalRemaining")}</p>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-xs text-amber-700">
            ⏳
          </span>
        </div>
        <p className="mt-2 truncate text-base font-bold text-amber-950 sm:text-xl">
          {formatMoney(totalRemaining, { currency, locale })}
        </p>
      </div>

      {/* 4. Total Overdue */}
      <div className="flex flex-col justify-between rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-50/70 to-rose-100/40 p-3.5 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-semibold text-rose-900">{t("totalOverdue")}</p>
            <span className="rounded-full bg-rose-200/80 px-1.5 py-0.2 text-[10px] font-bold text-rose-800">
              {t("invoicesCount", { count: totalCount })}
            </span>
          </div>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-xs text-rose-700">
            ⚠️
          </span>
        </div>
        <p className="mt-2 truncate text-base font-bold text-rose-950 sm:text-xl">
          {formatMoney(totalOverdue, { currency, locale })}
        </p>
      </div>
    </div>
  );
}
