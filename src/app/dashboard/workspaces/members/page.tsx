import Link from "next/link";
import { requireSession } from "@/features/auth/session";
import { getActiveWorkspaceForPage } from "@/features/workspaces/page-gate";
import { getWorkspaceAccess, isWorkspaceOwner } from "@/features/workspaces/access";
import {
  countWorkspaceSeats,
  getWorkspaceEffectivePlan,
  listPendingInvitations,
  listWorkspaceMembers,
  workspaceHasTeamFeature,
} from "@/features/workspaces/members-data";
import { InviteMemberManager } from "@/features/workspaces/components/invite-member-manager";
import { WorkspaceMembersPanel } from "@/features/workspaces/components/workspace-members-panel";
import { getLocalizedPlanFeatureMessage } from "@/i18n/plans-localized";
import { getMaxMembersForPlan } from "@/features/subscriptions/plan-config-data";
import { toQuantityUsage } from "@/features/subscriptions/quantity-usage";
import { PlanUsageMeter } from "@/features/subscriptions/components/plan-usage-meter";
import { getTranslations } from "next-intl/server";

export default async function WorkspaceMembersPage() {
  const session = await requireSession();
  const t = await getTranslations("workspaceTeam");
  const tPlan = await getTranslations("dashboard.plan");
  const tUsage = await getTranslations("dashboard.usage");
  const { activeWorkspace, redirect } = await getActiveWorkspaceForPage(session.user.id);
  if (redirect) return redirect;
  const workspaceId = activeWorkspace._id.toString();

  const access = await getWorkspaceAccess(session.user.id, workspaceId);
  const isOwner = isWorkspaceOwner(access.membership.role);

  const [members, invitations, teamEnabled, seats, effectivePlan] = await Promise.all([
    listWorkspaceMembers(workspaceId),
    isOwner ? listPendingInvitations(workspaceId) : Promise.resolve([]),
    workspaceHasTeamFeature(workspaceId),
    countWorkspaceSeats(workspaceId),
    getWorkspaceEffectivePlan(workspaceId),
  ]);
  const memberLimit = await getMaxMembersForPlan(effectivePlan);
  const usage = toQuantityUsage(seats, memberLimit);

  const upgradeMessage = await getLocalizedPlanFeatureMessage("teamWorkspace");

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">{t("pageTitle")}</h1>
          <p className="text-sm text-neutral-500">{activeWorkspace.name}</p>
        </div>
        {isOwner && teamEnabled && !usage.atLimit && (
          <InviteMemberManager workspaceId={workspaceId} canInvite={true} />
        )}
      </div>

      {!isOwner && (
        <p className="rounded-2xl border border-neutral-200 bg-neutral-50/70 px-5 py-3.5 text-sm text-neutral-600">
          {t("memberViewHint")}
        </p>
      )}

      {isOwner && !teamEnabled && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-sm text-amber-900">
          <p className="font-medium">{upgradeMessage}</p>
          <div className="mt-3">
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-emerald-800"
            >
              {tPlan("viewPricing")}
            </Link>
          </div>
        </div>
      )}

      {isOwner && teamEnabled && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs">
          <PlanUsageMeter usage={usage} label={tUsage("members")} />
        </div>
      )}

      <WorkspaceMembersPanel
        workspaceId={workspaceId}
        members={members}
        invitations={invitations}
        isOwner={isOwner}
        currentUserId={session.user.id}
      />
    </div>
  );
}
