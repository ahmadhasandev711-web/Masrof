"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  adminAddWorkspaceMemberAction,
  adminRemoveWorkspaceMemberAction,
  adminChangeMemberRoleAction,
  adminTransferWorkspaceOwnershipAction,
} from "@/features/admin/actions/workspace-admin-controls";
import type { WorkspaceRole } from "@/models/workspace-membership";

type MemberItem = {
  userId: string;
  name: string;
  email: string;
  role: WorkspaceRole;
  joinedAt: Date | string;
};

type Props = {
  workspaceId: string;
  members: MemberItem[];
};

export function WorkspaceMembersAdminControls({ workspaceId, members }: Props) {
  const t = useTranslations("admin.workspaces");
  const [isPending, startTransition] = useTransition();

  // Add Member form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"member" | "viewer">("member");

  function run(action: () => Promise<{ error: string | null; success: boolean }>) {
    startTransition(async () => {
      const res = await action();
      if (res.error) {
        window.alert(res.error);
      }
    });
  }

  function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim()) return;

    run(async () => {
      const res = await adminAddWorkspaceMemberAction(workspaceId, newEmail, newRole);
      if (res.success) {
        setNewEmail("");
        setShowAddForm(false);
      }
      return res;
    });
  }

  const getRoleLabel = (role: WorkspaceRole) => {
    if (role === "owner") return t("roleOwner");
    if (role === "viewer") return t("roleViewer");
    return t("roleMember");
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-xs overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-200 bg-neutral-50/50 px-6 py-4">
        <div>
          <h2 className="text-base font-bold text-neutral-900">{t("membersTitle")}</h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            {t("membersSubtitle", { count: members.length })}
          </p>
        </div>

        <button
          type="button"
          disabled={isPending}
          onClick={() => setShowAddForm((prev) => !prev)}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-neutral-800 disabled:opacity-50 transition w-fit"
        >
          <span>{showAddForm ? t("cancelAddMember") : t("addMemberDirectly")}</span>
        </button>
      </div>

      {/* Add Member Form Drawer/Banner */}
      {showAddForm && (
        <form
          onSubmit={handleAddMember}
          className="flex flex-wrap items-center gap-3 border-b border-neutral-200 bg-violet-50/50 p-4"
        >
          <div className="flex flex-col gap-1 min-w-[240px] flex-1">
            <label className="text-xs font-semibold text-neutral-700">{t("employeeEmail")}:</label>
            <input
              type="email"
              required
              placeholder="user@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-900 shadow-xs focus:outline-hidden focus:border-violet-500"
              dir="ltr"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-neutral-700">{t("role")}:</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as "member" | "viewer")}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-900 shadow-xs"
            >
              <option value="member">{t("roleMember")}</option>
              <option value="viewer">{t("roleViewer")}</option>
            </select>
          </div>

          <div className="flex items-end self-end pt-1">
            <button
              type="submit"
              disabled={isPending || !newEmail.trim()}
              className="rounded-lg bg-violet-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-violet-800 disabled:opacity-50 transition"
            >
              {isPending ? t("adding") : t("confirmAdd")}
            </button>
          </div>
        </form>
      )}

      {/* Members Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500 text-xs">
            <tr>
              <th className="px-6 py-3 font-medium">{t("memberName")}</th>
              <th className="px-6 py-3 font-medium">{t("memberEmail")}</th>
              <th className="px-6 py-3 font-medium">{t("memberRole")}</th>
              <th className="px-6 py-3 font-medium">{t("memberJoinedAt")}</th>
              <th className="px-6 py-3 font-medium text-left">{t("actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {members.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-neutral-400">
                  {t("noMembers")}
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.userId} className="hover:bg-neutral-50 transition">
                  <td className="px-6 py-3 font-medium text-neutral-900">{member.name}</td>
                  <td className="px-6 py-3 font-mono text-xs text-neutral-600" dir="ltr">
                    {member.email}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${
                        member.role === "owner"
                          ? "bg-amber-50 text-amber-800 border border-amber-200/60"
                          : member.role === "viewer"
                            ? "bg-neutral-100 text-neutral-700 border border-neutral-200/60"
                            : "bg-blue-50 text-blue-700 border border-blue-200/60"
                      }`}
                    >
                      {getRoleLabel(member.role)}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-neutral-500 text-xs">
                    {member.joinedAt
                      ? new Date(member.joinedAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-6 py-3 text-left">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      {member.role !== "owner" ? (
                        <>
                          {/* Role Switcher */}
                          <select
                            defaultValue={member.role}
                            disabled={isPending}
                            onChange={(e) =>
                              run(() =>
                                adminChangeMemberRoleAction(
                                  workspaceId,
                                  member.userId,
                                  e.target.value as WorkspaceRole,
                                ),
                              )
                            }
                            className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-700 shadow-2xs hover:border-neutral-300"
                          >
                            <option value="member">{t("roleMember")}</option>
                            <option value="viewer">{t("roleViewer")}</option>
                          </select>

                          {/* Transfer Ownership */}
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => {
                              if (window.confirm(t("confirmTransferOwnership", { name: member.name }))) {
                                run(() =>
                                  adminTransferWorkspaceOwnershipAction(workspaceId, member.userId),
                                );
                              }
                            }}
                            className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50 transition"
                            title={t("transferOwnershipHint")}
                          >
                            {t("makeOwner")}
                          </button>

                          {/* Remove Member */}
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => {
                              if (window.confirm(t("confirmRemoveMember", { name: member.name }))) {
                                run(() =>
                                  adminRemoveWorkspaceMemberAction(workspaceId, member.userId),
                                );
                              }
                            }}
                            className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 transition"
                          >
                            {t("removeMember")}
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-amber-700 font-semibold px-2 py-1">
                          {t("primaryOwner")}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
