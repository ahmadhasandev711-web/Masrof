"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  cancelInvitationAction,
  removeMemberAction,
} from "@/features/workspaces/actions/members";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { NavIcon } from "@/components/ui/app-icons";
import { useToasts, ToastStack } from "@/components/ui/toast";
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
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { toasts, show: toast, dismiss } = useToasts();
  const [targetRemoveUser, setTargetRemoveUser] = useState<WorkspaceMemberRow | null>(null);
  const [targetCancelInvite, setTargetCancelInvite] = useState<WorkspaceInvitationRow | null>(null);

  function confirmRemove() {
    if (!targetRemoveUser) return;
    const user = targetRemoveUser;
    startTransition(async () => {
      const result = await removeMemberAction(workspaceId, user.userId);
      if (result.error) {
        toast(result.error, "error");
      } else {
        router.refresh();
      }
      setTargetRemoveUser(null);
    });
  }

  function confirmCancel() {
    if (!targetCancelInvite) return;
    const invite = targetCancelInvite;
    startTransition(async () => {
      const result = await cancelInvitationAction(invite.id, workspaceId);
      if (result.error) {
        toast(result.error, "error");
      } else {
        router.refresh();
      }
      setTargetCancelInvite(null);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-2">
            <NavIcon name="team" className="h-5 w-5 text-neutral-700" />
            <h2 className="font-semibold text-neutral-900">{t("membersTitle")}</h2>
          </div>
          <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 font-mono text-xs font-medium tabular-nums text-neutral-600">
            {members.length}
          </span>
        </div>
        <ul className="mt-2 divide-y divide-neutral-100">
          {members.map((member) => (
            <li key={member.userId} className="flex items-center justify-between gap-3 py-3.5 text-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-800">
                  {member.name ? member.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">{member.name}</p>
                  <p className="text-xs text-neutral-500" dir="ltr">
                    {member.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    member.role === "owner"
                      ? "bg-emerald-100 text-emerald-800"
                      : member.role === "viewer"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-neutral-100 text-neutral-700"
                  }`}
                >
                  {roleLabel(member.role, t)}
                </span>
                {isOwner && member.userId !== currentUserId && member.role !== "owner" && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => setTargetRemoveUser(member)}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
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
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <div className="flex items-center gap-2">
              <NavIcon name="inbox" className="h-5 w-5 text-amber-700" />
              <h2 className="font-semibold text-neutral-900">{t("pendingTitle")}</h2>
            </div>
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 font-mono text-xs font-medium tabular-nums text-amber-700">
              {invitations.length}
            </span>
          </div>
          <ul className="mt-2 divide-y divide-neutral-100">
            {invitations.map((invite) => (
              <li key={invite.id} className="flex items-center justify-between gap-3 py-3.5 text-sm">
                <div>
                  <p className="font-medium text-neutral-900" dir="ltr">
                    {invite.email}
                  </p>
                  <p className="text-xs text-neutral-500">{t("pendingExpires")}</p>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setTargetCancelInvite(invite)}
                  className="rounded-lg px-2.5 py-1 text-xs font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-red-600 disabled:opacity-50"
                >
                  {t("cancelInvite")}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Remove Member Confirmation Dialog */}
      <ConfirmDialog
        open={targetRemoveUser !== null}
        title={tCommon("confirmation")}
        message={t("confirmRemoveMember")}
        confirmLabel={t("removeMember")}
        pendingLabel={t("removing")}
        tone="danger"
        isPending={pending}
        onConfirm={confirmRemove}
        onCancel={() => setTargetRemoveUser(null)}
      />

      {/* Cancel Invite Confirmation Dialog */}
      <ConfirmDialog
        open={targetCancelInvite !== null}
        title={tCommon("confirmation")}
        message={t("confirmCancelInvite")}
        confirmLabel={t("cancelInvite")}
        pendingLabel={t("cancelling")}
        tone="danger"
        isPending={pending}
        onConfirm={confirmCancel}
        onCancel={() => setTargetCancelInvite(null)}
      />

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
