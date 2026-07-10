import Link from "next/link";
import { requireSession } from "@/features/auth/session";
import { getCurrentWorkspaceContext } from "@/features/workspaces/current";
import { listSavingsGoals } from "@/features/savings-goals/data";
import { CreateSavingsGoalForm } from "@/features/savings-goals/components/create-savings-goal-form";
import { SavingsGoalList } from "@/features/savings-goals/components/savings-goal-list";
import { getWorkspacePlanContext } from "@/features/subscriptions/data";
import { getTranslations } from "next-intl/server";

export default async function SavingsGoalsPage() {
  const session = await requireSession();
  const t = await getTranslations("pages.goals");
  const tDashboard = await getTranslations("dashboard");
  const tPlan = await getTranslations("dashboard.plan");
  const { activeWorkspace } = await getCurrentWorkspaceContext(session.user.id);
  const workspaceId = activeWorkspace._id.toString();
  const { plan } = await getWorkspacePlanContext(session.user.id, workspaceId);

  const goals = await listSavingsGoals(workspaceId);

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">{t("title")}</h1>
        <p className="text-sm text-neutral-500">{activeWorkspace.name}</p>
      </div>

      {plan.savingsGoals ? (
        <>
          <CreateSavingsGoalForm workspaceId={workspaceId} />
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
