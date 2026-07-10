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
  const tSummary = await getTranslations("reports.summary");
  const tConversion = await getTranslations("reports.conversion");

  const unavailable = (
    <span className="text-sm font-medium text-amber-700">{tConversion("unavailable")}</span>
  );

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-center shadow-sm">
        <p className="text-xs text-neutral-400">{tSummary("totalIncome")}</p>
        <p className="mt-1 font-bold text-emerald-700">
          {income == null ? unavailable : formatMoney(income, { currency })}
        </p>
      </div>
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-center shadow-sm">
        <p className="text-xs text-neutral-400">{tSummary("totalExpense")}</p>
        <p className="mt-1 font-bold text-red-600">
          {expense == null ? unavailable : formatMoney(expense, { currency })}
        </p>
      </div>
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-center shadow-sm">
        <p className="text-xs text-neutral-400">{tSummary("net")}</p>
        <p className={`mt-1 font-bold ${net != null && net >= 0 ? "text-emerald-700" : net != null ? "text-red-600" : "text-amber-700"}`}>
          {net == null ? unavailable : formatMoney(net, { currency })}
        </p>
      </div>
    </div>
  );
}
