import Link from "next/link";
import { requireSession } from "@/features/auth/session";
import { getActiveWorkspaceForPage } from "@/features/workspaces/page-gate";
import { listSavingsGoals } from "@/features/savings-goals/data";
import { SavingsGoalCreationManager } from "@/features/savings-goals/components/savings-goal-creation-manager";
import { SavingsGoalList } from "@/features/savings-goals/components/savings-goal-list";
import { getWorkspacePlanContext } from "@/features/subscriptions/data";
import { getPlanQuantityLimit } from "@/features/subscriptions/plan-config-data";
import { countSavingsGoalsForWorkspace, toQuantityUsage } from "@/features/subscriptions/plan-usage";
import { PlanUsageMeter } from "@/features/subscriptions/components/plan-usage-meter";
import { formatMoney } from "@/lib/money";
import { getTranslations, getLocale } from "next-intl/server";

export default async function SavingsGoalsPage() {
  const session = await requireSession();
  const t = await getTranslations("pages.goals");
  const tUsage = await getTranslations("dashboard.usage");
  const tDashboard = await getTranslations("dashboard");
  const tPlan = await getTranslations("dashboard.plan");
  const { activeWorkspace, redirect } = await getActiveWorkspaceForPage(session.user.id);
  if (redirect) return redirect;
  const workspaceId = activeWorkspace._id.toString();

  const [{ plan, subscription }, goals, goalCount, locale] = await Promise.all([
    getWorkspacePlanContext(session.user.id, workspaceId),
    listSavingsGoals(workspaceId),
    countSavingsGoalsForWorkspace(workspaceId),
    getLocale(),
  ]);

  const goalLimit = await getPlanQuantityLimit(subscription.plan, "maxSavingsGoals");
  const usage = toQuantityUsage(goalCount, goalLimit);

  const totalTarget = goals.reduce((sum, g) => sum + (g.targetAmount || 0), 0);
  const totalSaved = goals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
  const totalRemaining = Math.max(0, totalTarget - totalSaved);
  const overallProgress = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

  const formatOptions = {
    currency: activeWorkspace.currency,
    locale: locale === "ar" ? "ar-EG" : "en-US",
  };

  return (
    <div className="flex max-w-5xl flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl">{t("title")}</h1>
          <p className="text-sm text-neutral-500">{t("subtitle")}</p>
        </div>
        {plan.savingsGoals && !usage.atLimit && (
          <SavingsGoalCreationManager workspaceId={workspaceId} />
        )}
      </div>

      {plan.savingsGoals ? (
        <>
          <PlanUsageMeter usage={usage} label={tUsage("savingsGoals")} />

          {goals.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs">
                <p className="text-xs font-medium text-neutral-500">{t("totalTarget")}</p>
                <p className="mt-1 font-mono text-base font-bold tabular-nums text-neutral-900 sm:text-lg">
                  {formatMoney(totalTarget, formatOptions)}
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs">
                <p className="text-xs font-medium text-neutral-500">{t("totalSaved")}</p>
                <p className="mt-1 font-mono text-base font-bold tabular-nums text-neutral-900 sm:text-lg">
                  {formatMoney(totalSaved, formatOptions)}
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs">
                <p className="text-xs font-medium text-neutral-500">{t("totalRemaining")}</p>
                <p className="mt-1 font-mono text-base font-bold tabular-nums text-neutral-900 sm:text-lg">
                  {formatMoney(totalRemaining, formatOptions)}
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs">
                <p className="text-xs font-medium text-neutral-500">{t("overallProgress")}</p>
                <p
                  className={`mt-1 font-mono text-base font-bold tabular-nums sm:text-lg ${
                    overallProgress >= 100
                      ? "text-emerald-700"
                      : overallProgress >= 50
                        ? "text-emerald-600"
                        : "text-neutral-700"
                  }`}
                >
                  {overallProgress}%
                </p>
              </div>
            </div>
          )}

          <SavingsGoalList
            goals={goals.map((g) => ({
              _id: String(g._id),
              name: g.name,
              targetAmount: g.targetAmount,
              currentAmount: g.currentAmount,
              remaining: g.remaining,
              percentage: g.percentage,
              deadline: g.deadline ?? null,
            }))}
            workspaceId={workspaceId}
            currency={activeWorkspace.currency}
          />
        </>
      ) : (
        <div className="rounded-xl border border-[#065F46]/15 bg-[#ECFDF5]/50 p-4 text-sm text-[#1C1B1A]/70">
          {tDashboard("featureGate.savingsGoals")}{" "}
          <Link href="/pricing" className="font-medium text-[#065F46] hover:underline">
            {tPlan("viewPricing")}
          </Link>
          .
        </div>
      )}
    </div>
  );
}
