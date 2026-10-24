import { formatMoney } from "@/lib/money";
import { ArchiveBudgetButton } from "@/features/budgets/components/archive-budget-button";
import { getTranslations, getLocale } from "next-intl/server";

type PopulatedCategory = { _id: unknown; name: string; icon?: string | null };

type BudgetItem = {
  _id: unknown;
  name: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  categoryId: PopulatedCategory | null;
};

function budgetAlert(percentage: number, labels: { exceeded: string; nearLimit: string }) {
  if (percentage >= 100) {
    return { text: labels.exceeded, className: "bg-red-100 text-red-700" };
  }
  if (percentage >= 80) {
    return { text: labels.nearLimit, className: "bg-amber-100 text-amber-800" };
  }
  return null;
}

function progressBarColor(percentage: number) {
  if (percentage >= 100) return "bg-red-600";
  if (percentage >= 80) return "bg-amber-500";
  return "bg-emerald-600";
}

export async function BudgetList({
  budgets,
  workspaceId,
  currency,
}: {
  budgets: BudgetItem[];
  workspaceId: string;
  currency: string;
}) {
  const [tEmpty, tForm, tDashboard, locale] = await Promise.all([
    getTranslations("empty"),
    getTranslations("forms.budget"),
    getTranslations("dashboard.alerts"),
    getLocale(),
  ]);

  const formatOptions = {
    currency,
    locale: locale === "ar" ? "ar-EG" : "en-US",
  };

  if (budgets.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-400">
        {tEmpty("noBudgets")}
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {budgets.map((budget) => {
        const id = String(budget._id);
        const clampedPercentage = Math.min(100, Math.max(0, budget.percentage));

        const alert = budgetAlert(budget.percentage, {
          exceeded: tDashboard("budgetExceeded"),
          nearLimit: tDashboard("budgetNearLimit"),
        });

        return (
          <li
            key={id}
            className={`rounded-xl border bg-white p-5 shadow-sm ${
              budget.percentage >= 100
                ? "border-red-200"
                : budget.percentage >= 80
                  ? "border-amber-200"
                  : "border-neutral-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div>
                  <p className="font-medium text-neutral-900">
                    {budget.categoryId?.icon ?? ""} {budget.name}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {budget.categoryId ? budget.categoryId.name : tForm("wholeWorkspace")}
                  </p>
                </div>
                {alert && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${alert.className}`}
                  >
                    {alert.text}
                  </span>
                )}
              </div>
              <ArchiveBudgetButton budgetId={id} workspaceId={workspaceId} />
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className={`h-full ${progressBarColor(budget.percentage)}`}
                style={{ width: `${clampedPercentage}%` }}
              />
            </div>

            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="font-mono tabular-nums text-neutral-500">
                {formatMoney(budget.spent, formatOptions)} / {formatMoney(budget.amount, formatOptions)}
              </span>
              <span
                className={`font-mono tabular-nums ${
                  budget.percentage >= 100
                    ? "font-semibold text-red-600"
                    : "font-medium text-neutral-600"
                }`}
              >
                {budget.percentage}%
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
