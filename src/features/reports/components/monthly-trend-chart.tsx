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
    <div className="rounded-2xl border border-[#E4DFD3] bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-[#1C1B1A]">{t("incomeVsExpense")}</h3>
        <div className="flex items-center gap-4 text-xs text-[#1C1B1A]/50">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#065F46]" /> {t("income")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> {t("expense")}
          </span>
        </div>
      </div>

      <div dir="ltr" className="flex w-full max-w-full items-end justify-between gap-2 overflow-x-auto pb-2 sm:gap-4">
        {months.map((month) => (
          <div key={month.label} className="flex min-w-[3rem] flex-1 flex-col items-center gap-2">
            <div className="flex h-36 w-full max-w-[4rem] items-end justify-center gap-1.5">
              <div className="group relative flex h-full flex-col justify-end">
                <div
                  title={`${t("income")}: ${month.income == null ? "—" : formatMoney(month.income, { currency, locale: moneyLocale })}`}
                  className="w-4 rounded-t-md bg-[#065F46] transition hover:bg-[#054d3a]"
                  style={{ height: `${barHeight(month.income, maxValue)}%` }}
                />
              </div>
              <div className="group relative flex h-full flex-col justify-end">
                <div
                  title={`${t("expense")}: ${month.expense == null ? "—" : formatMoney(month.expense, { currency, locale: moneyLocale })}`}
                  className="w-4 rounded-t-md bg-red-500 transition hover:bg-red-600"
                  style={{ height: `${barHeight(month.expense, maxValue)}%` }}
                />
              </div>
            </div>
            <span className="text-center text-[11px] leading-tight text-[#1C1B1A]/55">
              {month.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
