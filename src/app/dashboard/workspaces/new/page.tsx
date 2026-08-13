import Link from "next/link";
import { requireSession } from "@/features/auth/session";
import { CreateWorkspaceForm } from "@/features/workspaces/components/create-workspace-form";
import { getUserSubscription } from "@/features/subscriptions/data";
import { getPlanConfig } from "@/features/subscriptions/plan-config-data";
import { toQuantityUsage } from "@/features/subscriptions/quantity-usage";
import { PlanUsageMeter } from "@/features/subscriptions/components/plan-usage-meter";
import { countOwnedWorkspacesForUser } from "@/features/workspaces/members-data";
import { getTranslations } from "next-intl/server";

export default async function NewWorkspacePage() {
  const session = await requireSession();
  const t = await getTranslations("pages.newWorkspace");
  const tUsage = await getTranslations("dashboard.usage");

  const [subscription, ownedCount] = await Promise.all([
    getUserSubscription(session.user.id),
    countOwnedWorkspacesForUser(session.user.id),
  ]);
  const config = await getPlanConfig(subscription.plan);
  const usage = toQuantityUsage(ownedCount, config.maxWorkspaces);

  return (
    <div className="mx-auto max-w-md">
      <Link href="/dashboard" className="text-sm text-neutral-400 hover:text-neutral-600">
        {t("back")}
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-neutral-900">{t("title")}</h1>
      <p className="mt-1 text-sm text-neutral-500">{t("subtitle")}</p>

      <div className="mt-6 flex flex-col gap-4">
        <PlanUsageMeter usage={usage} label={tUsage("workspaces")} />
        {usage.atLimit ? null : (
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <CreateWorkspaceForm mode="new" />
          </div>
        )}
      </div>
    </div>
  );
}
