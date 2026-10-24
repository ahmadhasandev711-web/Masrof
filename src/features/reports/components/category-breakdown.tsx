import { formatMoney } from "@/lib/money";
import { getTranslations } from "next-intl/server";

type CategoryBreakdownRow = {
  categoryId: unknown;
  name: string;
  icon: string | null;
  total: number | null;
};

export async function CategoryBreakdown({
  title,
  rows,
  currency,
  barColorClass,
}: {
  title: string;
  rows: CategoryBreakdownRow[];
  currency: string;
  barColorClass: string;
}) {
  const [tEmpty, tConversion] = await Promise.all([
    getTranslations("empty"),
    getTranslations("reports.conversion"),
  ]);

  const totalSum = rows.reduce((sum, r) => sum + (r.total ?? 0), 0);

  return (
    <div className="rounded-3xl border border-neutral-200/90 bg-white p-5 sm:p-6 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm sm:text-base font-bold text-neutral-900">{title}</h3>
        {totalSum > 0 && (
          <span className="font-mono text-xs font-bold text-neutral-500 tabular-nums">
            {formatMoney(totalSum, { currency })}
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-neutral-400 py-6 text-center">{tEmpty("noDataInRange")}</p>
      ) : (
        <ul className="flex flex-col gap-3.5">
          {rows.map((row) => {
            const amount = row.total ?? 0;
            const percentage = totalSum > 0 ? Math.round((amount / totalSum) * 100) : 0;

            return (
              <li key={String(row.categoryId)}>
                <div className="mb-1.5 flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm shrink-0">{row.icon ?? ""}</span>
                    <span className="truncate font-semibold text-neutral-800">{row.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-bold text-neutral-900 tabular-nums">
                      {row.total == null
                        ? tConversion("unavailable")
                        : formatMoney(row.total, { currency })}
                    </span>
                    <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold text-neutral-600 font-mono">
                      {percentage}%
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColorClass}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
