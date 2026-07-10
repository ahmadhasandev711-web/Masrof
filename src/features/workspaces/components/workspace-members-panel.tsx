"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  cancelInvitationAction,
  removeMemberAction,
} from "@/features/workspaces/actions/members";
import type { WorkspaceInvitationRow, WorkspaceMemberRow } from "@/features/workspaces/members-data";
import type { WorkspaceRole } from "@/models/workspace-membership";

function roleLabel(role: WorkspaceRole, t: ReturnType<typeof useTranslations<"workspaceTeam">>) {
  if (role === "owner") return t("roleOwner");
  if (role === "viewer") return t("roleViewer");
  return t("roleMember");
}

export function WorkspaceMembersPanel({
  workspaceId,
  members,
  invitations,
  isOwner,
  currentUserId,
}: {
  workspaceId: string;
  members: WorkspaceMemberRow[];
  invitations: WorkspaceInvitationRow[];
  isOwner: boolean;
  currentUserId: string;
}) {
  const t = useTranslations("workspaceTeam");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleRemove(memberUserId: string) {
    startTransition(async () => {
      const result = await removeMemberAction(workspaceId, memberUserId);
      if (!result.error) router.refresh();
    });
  }

  function handleCancel(invitationId: string) {
    startTransition(async () => {
      const result = await cancelInvitationAction(invitationId, workspaceId);
      if (!result.error) router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-[#E4DFD3] bg-white p-5">
        <h2 className="font-semibold text-[#1C1B1A]">{t("membersTitle")}</h2>
        <ul className="mt-4 divide-y divide-neutral-100">
          {members.map((member) => (
            <li key={member.userId} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div>
                <p className="font-medium text-neutral-900">{member.name}</p>
                <p className="text-neutral-500" dir="ltr">
                  {member.email}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                  {roleLabel(member.role, t)}
                </span>
                {isOwner && member.userId !== currentUserId && member.role !== "owner" && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => handleRemove(member.userId)}
                    className="text-xs text-red-600 hover:underline disabled:opacity-50"
                  >
                    {t("removeMember")}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {isOwner && invitations.length > 0 && (
        <section className="rounded-2xl border border-[#E4DFD3] bg-white p-5">
          <h2 className="font-semibold text-[#1C1B1A]">{t("pendingTitle")}</h2>
          <ul className="mt-4 divide-y divide-neutral-100">
            {invitations.map((invite) => (
              <li key={invite.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium text-neutral-900" dir="ltr">
                    {invite.email}
                  </p>
                  <p className="text-xs text-neutral-500">{t("pendingExpires")}</p>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleCancel(invite.id)}
                  className="text-xs text-red-600 hover:underline disabled:opacity-50"
                >
                  {t("cancelInvite")}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
