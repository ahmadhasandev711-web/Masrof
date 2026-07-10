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
  const numericTotals = rows.map((r) => r.total ?? 0);
  const maxTotal = Math.max(...numericTotals, 1);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 font-semibold text-neutral-900">{title}</h3>

      {rows.length === 0 ? (
        <p className="text-sm text-neutral-400">{tEmpty("noDataInRange")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <li key={String(row.categoryId)}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-neutral-700">
                  {row.icon ?? "🏷️"} {row.name}
                </span>
                <span className="font-medium text-neutral-900">
                  {row.total == null
                    ? tConversion("unavailable")
                    : formatMoney(row.total, { currency })}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                <div
                  className={`h-full ${barColorClass}`}
                  style={{ width: `${((row.total ?? 0) / maxTotal) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
