"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { CreateSavingsGoalForm } from "@/features/savings-goals/components/create-savings-goal-form";
import { useTranslations } from "next-intl";

export function SavingsGoalCreationManager({
  workspaceId,
  canWrite = true,
}: {
  workspaceId: string;
  canWrite?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("forms.savingsGoal");

  if (!canWrite) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-[#065F46] px-4 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-[#054E3A] active:scale-98"
      >
        <span className="text-base font-bold leading-none">+</span>
        <span>{t("title")}</span>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={t("title")}
        maxWidthClassName="max-w-xl"
      >
        <CreateSavingsGoalForm
          workspaceId={workspaceId}
          showTitle={false}
          onSuccess={() => setIsOpen(false)}
          onCancel={() => setIsOpen(false)}
        />
      </Modal>
    </>
  );
}
