"use client";

import { useTransition } from "react";
import { archiveTransactionAction } from "@/features/transactions/actions/archive-transaction";
import { useTranslations } from "next-intl";
import { NavIcon } from "@/components/ui/app-icons";
import { MOBILE_ACTION_BTN } from "@/components/ui/mobile-field";

export function ArchiveTransactionButton({
  transactionId,
  workspaceId,
}: {
  transactionId: string;
  workspaceId: string;
}) {
  const tConfirm = useTranslations("confirm");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => {
        if (!confirm(tConfirm("deleteTransaction"))) return;
        startTransition(() => archiveTransactionAction(transactionId, workspaceId));
      }}
      disabled={isPending}
      className={`${MOBILE_ACTION_BTN} border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 disabled:opacity-50`}
    >
      <NavIcon name="trash" className="h-4 w-4 shrink-0" />
      <span>{tCommon("delete")}</span>
    </button>
  );
}
