"use client";

import { useState, useTransition } from "react";
import { archiveBudgetAction } from "@/features/budgets/actions/archive-budget";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTranslations } from "next-intl";

export function ArchiveBudgetButton({
  budgetId,
  workspaceId,
}: {
  budgetId: string;
  workspaceId: string;
}) {
  const [open, setOpen] = useState(false);
  const tConfirm = useTranslations("confirm");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={isPending}
        className="text-xs text-neutral-400 transition hover:text-red-600 disabled:opacity-60"
      >
        {tCommon("delete")}
      </button>

      <ConfirmDialog
        open={open}
        title={tCommon("confirmation")}
        message={tConfirm("deleteBudget")}
        confirmLabel={tCommon("delete")}
        pendingLabel={tCommon("deleting")}
        isPending={isPending}
        onConfirm={() => {
          startTransition(async () => {
            await archiveBudgetAction(budgetId, workspaceId);
            setOpen(false);
          });
        }}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
