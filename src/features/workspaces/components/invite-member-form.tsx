"use client";

import { useActionState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  inviteMemberAction,
  type MemberActionState,
} from "@/features/workspaces/actions/members";

const initialState: MemberActionState = { error: null };

export function InviteMemberForm({
  workspaceId,
  onSuccess,
  onCancel,
  showTitle = true,
}: {
  workspaceId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  showTitle?: boolean;
}) {
  const t = useTranslations("workspaceTeam");
  const tCommon = useTranslations("common");
  const [state, formAction, isPending] = useActionState(inviteMemberAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const hasSubmitted = useRef(false);

  useEffect(() => {
    if (hasSubmitted.current && !isPending && state.success && !state.error) {
      formRef.current?.reset();
      hasSubmitted.current = false;
      onSuccess?.();
    }
  }, [isPending, state.success, state.error, onSuccess]);

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={() => {
        hasSubmitted.current = true;
      }}
      className={
        showTitle
          ? "flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs dark:border-[#26302C] dark:bg-[#161E1B]"
          : "flex flex-col gap-4"
      }
    >
      {showTitle && (
        <div>
          <h2 className="font-semibold text-neutral-900 dark:text-[#ECEAE4]">{t("inviteTitle")}</h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-[#9AA39F]">{t("inviteHint")}</p>
        </div>
      )}

      <input type="hidden" name="workspaceId" value={workspaceId} />

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-neutral-700 dark:text-[#ECEAE4]">{t("emailLabel")}</span>
        <input
          name="email"
          type="email"
          required
          dir="ltr"
          placeholder={t("emailPlaceholder")}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-[#26302C] dark:bg-[#1E2824] dark:text-[#ECEAE4] dark:placeholder:text-[#66706B] dark:focus:border-[#34D399] dark:focus:ring-[#34D399]/20"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-neutral-700 dark:text-[#ECEAE4]">{t("inviteRoleLabel")}</span>
        <select
          name="role"
          defaultValue="member"
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-[#26302C] dark:bg-[#1E2824] dark:text-[#ECEAE4] dark:focus:border-[#34D399] dark:focus:ring-[#34D399]/20"
        >
          <option value="member">{t("inviteRoleMember")}</option>
          <option value="viewer">{t("inviteRoleViewer")}</option>
        </select>
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}
      {state.success && !state.error && (
        <p className="text-sm text-emerald-700 dark:text-[#34D399]">{t("inviteSent")}</p>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-60 dark:border-[#26302C] dark:text-[#9AA39F] dark:hover:bg-[#1E2824]"
          >
            {tCommon("cancel")}
          </button>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-[#065F46] px-5 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-[#054d3a] disabled:opacity-60 dark:bg-[#10B981] dark:text-[#04231A] dark:hover:bg-[#34D399]"
        >
          {isPending ? t("inviting") : t("inviteButton")}
        </button>
      </div>
    </form>
  );
}
