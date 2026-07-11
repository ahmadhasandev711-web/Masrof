import Link from "next/link";
import { requireSession } from "@/features/auth/session";
import { getActiveWorkspaceForPage } from "@/features/workspaces/page-gate";
import { getWorkspaceAccess, isWorkspaceOwner } from "@/features/workspaces/access";
import {
  listPendingInvitations,
  listWorkspaceMembers,
  workspaceOwnerHasTeamFeature,
} from "@/features/workspaces/members-data";
import { InviteMemberForm } from "@/features/workspaces/components/invite-member-form";
import { WorkspaceMembersPanel } from "@/features/workspaces/components/workspace-members-panel";
import { getLocalizedPlanFeatureMessage } from "@/i18n/plans-localized";
import { getTranslations } from "next-intl/server";

export default async function WorkspaceMembersPage() {
  const session = await requireSession();
  const t = await getTranslations("workspaceTeam");
  const tPlan = await getTranslations("dashboard.plan");
  const { activeWorkspace, redirect } = await getActiveWorkspaceForPage(session.user.id);
  if (redirect) return redirect;
  const workspaceId = activeWorkspace._id.toString();

  const access = await getWorkspaceAccess(session.user.id, workspaceId);
  const isOwner = isWorkspaceOwner(access.membership.role);

  const [members, invitations, teamEnabled] = await Promise.all([
    listWorkspaceMembers(workspaceId),
    isOwner ? listPendingInvitations(workspaceId) : Promise.resolve([]),
    workspaceOwnerHasTeamFeature(activeWorkspace.ownerId),
  ]);

  const upgradeMessage = await getLocalizedPlanFeatureMessage("teamWorkspace");

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">{t("pageTitle")}</h1>
        <p className="text-sm text-neutral-500">{activeWorkspace.name}</p>
      </div>

      {!isOwner && (
        <p className="rounded-xl border border-[#E4DFD3] bg-[#F3F0E8]/50 px-4 py-3 text-sm text-neutral-600">
          {t("memberViewHint")}
        </p>
      )}

      {isOwner && !teamEnabled && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {upgradeMessage}{" "}
          <Link href="/pricing" className="font-medium text-[#065F46] hover:underline">
            {tPlan("viewPricing")}
          </Link>
        </div>
      )}

      {isOwner && teamEnabled && <InviteMemberForm workspaceId={workspaceId} />}

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
