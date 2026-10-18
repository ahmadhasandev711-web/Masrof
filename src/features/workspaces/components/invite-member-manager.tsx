"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { InviteMemberForm } from "@/features/workspaces/components/invite-member-form";
import { useTranslations } from "next-intl";

export function InviteMemberManager({
  workspaceId,
  canInvite = true,
}: {
  workspaceId: string;
  canInvite?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("workspaceTeam");

  if (!canInvite) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-[#065F46] px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-[#054E3A] active:scale-98"
      >
        <span className="text-base font-bold leading-none">+</span>
        <span>{t("newInviteBtn")}</span>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={t("inviteTitle")}
        maxWidthClassName="max-w-md"
      >
        <InviteMemberForm
          workspaceId={workspaceId}
          showTitle={false}
          onSuccess={() => setIsOpen(false)}
          onCancel={() => setIsOpen(false)}
        />
      </Modal>
    </>
  );
}
