"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { CreateRecurringExpenseForm } from "@/features/recurring-expenses/components/create-recurring-form";
import { useTranslations } from "next-intl";

export function RecurringExpenseCreationManager({
  workspaceId,
  accounts,
  expenseCategories,
  canWrite = true,
}: {
  workspaceId: string;
  accounts: { id: string; name: string }[];
  expenseCategories: { id: string; name: string; icon?: string | null }[];
  canWrite?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("forms.recurring");

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
        subtitle={t("hint")}
        maxWidthClassName="max-w-xl"
      >
        <CreateRecurringExpenseForm
          workspaceId={workspaceId}
          accounts={accounts}
          expenseCategories={expenseCategories}
          showTitle={false}
          onSuccess={() => setIsOpen(false)}
          onCancel={() => setIsOpen(false)}
        />
      </Modal>
    </>
  );
}
