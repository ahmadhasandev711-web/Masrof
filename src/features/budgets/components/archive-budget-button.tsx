"use client";

import { useTransition } from "react";
import { archiveBudgetAction } from "@/features/budgets/actions/archive-budget";
import { useTranslations } from "next-intl";

export function ArchiveBudgetButton({
  budgetId,
  workspaceId,
}: {
  budgetId: string;
  workspaceId: string;
}) {
  const tConfirm = useTranslations("confirm");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        if (!confirm(tConfirm("deleteBudget"))) return;
        startTransition(() => archiveBudgetAction(budgetId, workspaceId));
      }}
      disabled={isPending}
      className="text-xs text-neutral-400 transition hover:text-red-600 disabled:opacity-60"
    >
      {tCommon("delete")}
    </button>
  );
}
