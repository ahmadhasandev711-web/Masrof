"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  inviteMemberAction,
  type MemberActionState,
} from "@/features/workspaces/actions/members";

const initialState: MemberActionState = { error: null };

export function InviteMemberForm({ workspaceId }: { workspaceId: string }) {
  const t = useTranslations("workspaceTeam");
  const [state, formAction, isPending] = useActionState(inviteMemberAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-2xl border border-[#E4DFD3] bg-white p-5">
      <div>
        <h2 className="font-semibold text-[#1C1B1A]">{t("inviteTitle")}</h2>
        <p className="mt-1 text-sm text-[#1C1B1A]/55">{t("inviteHint")}</p>
      </div>

      <input type="hidden" name="workspaceId" value={workspaceId} />

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-neutral-700">{t("emailLabel")}</span>
        <input
          name="email"
          type="email"
          required
          dir="ltr"
          placeholder={t("emailPlaceholder")}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-neutral-700">{t("inviteRoleLabel")}</span>
        <select
          name="role"
          defaultValue="member"
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900"
        >
          <option value="member">{t("inviteRoleMember")}</option>
          <option value="viewer">{t("inviteRoleViewer")}</option>
        </select>
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state.success && !state.error && (
        <p className="text-sm text-emerald-700">{t("inviteSent")}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-lg bg-[#065F46] px-4 py-2 text-sm font-medium text-white hover:bg-[#054d3a] disabled:opacity-60"
      >
        {isPending ? t("inviting") : t("inviteButton")}
      </button>
    </form>
  );
}
