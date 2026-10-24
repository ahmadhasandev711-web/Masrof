import { getTranslations } from "next-intl/server";
import { formatMoney } from "@/lib/money";

type MonthlyRow = {
  label: string;
  income: number | null;
  expense: number | null;
};

function barHeight(value: number | null, maxValue: number) {
  if (value == null || value <= 0) return 4;
  return Math.max(8, Math.round((value / maxValue) * 100));
}

export async function MonthlyTrendChart({
  months,
  currency,
  moneyLocale,
}: {
  months: MonthlyRow[];
  currency: string;
  moneyLocale: string;
}) {
  const t = await getTranslations("charts");
  const maxValue = Math.max(...months.flatMap((m) => [m.income ?? 0, m.expense ?? 0]), 1);

  return (
    <div className="rounded-3xl border border-neutral-200/90 bg-white p-4 sm:p-6 shadow-xs">
      {/* Header with Title & Legend */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-base"></span>
          <h3 className="text-sm sm:text-base font-bold text-neutral-900">{t("incomeVsExpense")}</h3>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold text-neutral-600">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#065F46]" /> {t("income")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> {t("expense")}
          </span>
        </div>
      </div>

      {/* Bars Chart Area */}
      <div dir="ltr" className="flex w-full items-end justify-between gap-2 overflow-x-auto pb-2 sm:gap-4">
        {months.map((month, idx) => {
          const isLatest = idx === months.length - 1;
          const incomeLabel = month.income == null ? "—" : formatMoney(month.income, { currency, locale: moneyLocale });
          const expenseLabel = month.expense == null ? "—" : formatMoney(month.expense, { currency, locale: moneyLocale });
          
          // Split month name and year for clean mobile rendering (e.g. "أكتوبر" on mobile, "أكتوبر 26" on desktop)
          const parts = month.label.split(" ");
          const monthShort = parts[0] || month.label;
          const yearPart = parts.slice(1).join(" ");

          return (
            <div key={month.label} className="flex min-w-[3.2rem] flex-1 flex-col items-center gap-2">
              <div className="flex h-40 w-full max-w-[4.5rem] items-end justify-center gap-1.5 sm:gap-2">
                {/* Income Bar */}
                <div className="group relative flex h-full flex-col justify-end">
                  <div
                    title={`${t("income")}: ${incomeLabel}`}
                    className="w-3.5 sm:w-4 rounded-t-md bg-[#065F46] transition-all hover:bg-[#054d3a] hover:opacity-90 active:scale-95"
                    style={{ height: `${barHeight(month.income, maxValue)}%` }}
                  />
                  {/* Tooltip on hover */}
                  <div className="pointer-events-none absolute bottom-full mb-1 start-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-20">
                    <span className="whitespace-nowrap rounded-lg bg-neutral-900 px-2 py-1 text-[10px] font-bold text-white shadow-md font-mono">
                      {incomeLabel}
                    </span>
                  </div>
                </div>

                {/* Expense Bar */}
                <div className="group relative flex h-full flex-col justify-end">
                  <div
                    title={`${t("expense")}: ${expenseLabel}`}
                    className="w-3.5 sm:w-4 rounded-t-md bg-rose-500 transition-all hover:bg-rose-600 hover:opacity-90 active:scale-95"
                    style={{ height: `${barHeight(month.expense, maxValue)}%` }}
                  />
                  {/* Tooltip on hover */}
                  <div className="pointer-events-none absolute bottom-full mb-1 start-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-20">
                    <span className="whitespace-nowrap rounded-lg bg-neutral-900 px-2 py-1 text-[10px] font-bold text-white shadow-md font-mono">
                      {expenseLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Month Label (Mobile-friendly: compact without clumsy wrap) */}
              <div className="text-center">
                <span className={`block text-[11px] font-semibold leading-tight ${isLatest ? "text-[#065F46] font-bold" : "text-neutral-500"}`}>
                  {monthShort}
                </span>
                {yearPart && (
                  <span className="hidden sm:block text-[9px] text-neutral-400">
                    {yearPart}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
