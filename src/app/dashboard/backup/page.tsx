import Link from "next/link";
import { requireSession } from "@/features/auth/session";
import { getActiveWorkspaceForPage } from "@/features/workspaces/page-gate";
import { getWorkspacePlanContext } from "@/features/subscriptions/data";
import { getWorkspaceAccess } from "@/features/workspaces/access";
import { BackupPanel } from "@/features/backup/components/backup-panel";
import { getTranslations } from "next-intl/server";

export default async function BackupPage() {
  const session = await requireSession();
  const t = await getTranslations("pages.backup");
  const tDashboard = await getTranslations("dashboard");
  const tPlan = await getTranslations("dashboard.plan");
  const { activeWorkspace, redirect } = await getActiveWorkspaceForPage(session.user.id);
  if (redirect) return redirect;
  const workspaceId = activeWorkspace._id.toString();

  const [access, { plan }] = await Promise.all([
    getWorkspaceAccess(session.user.id, workspaceId),
    getWorkspacePlanContext(session.user.id, workspaceId),
  ]);
  const isOwner = access.membership.role === "owner";

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-[#ECEAE4]">{t("title")}</h1>
        <p className="text-sm text-neutral-500 dark:text-[#9AA39F]">{activeWorkspace.name}</p>
      </div>

      {!isOwner ? (
        <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm text-amber-900 dark:text-amber-200">
          {t("ownerOnlyNotice")}
        </div>
      ) : plan.workspaceBackup ? (
        <BackupPanel
          workspaceId={workspaceId}
          workspaceName={activeWorkspace.name}
          canUseBackup
        />
      ) : (
        <div className="rounded-xl border border-[#065F46]/15 dark:border-[#34D399]/25 bg-[#ECFDF5]/50 dark:bg-[#0F2E24] p-4 text-sm text-[#1C1B1A]/70 dark:text-[#ECEAE4]">
          {tDashboard("featureGate.backup")}{" "}
          <Link href="/pricing" className="font-medium text-[#065F46] dark:text-[#34D399] hover:underline">
            {tPlan("viewPricing")}
          </Link>
          .
        </div>
      )}
    </div>
  );
}
