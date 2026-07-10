"use client";

import { useTransition } from "react";
import { archiveTransactionAction } from "@/features/transactions/actions/archive-transaction";
import { useTranslations } from "next-intl";

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
      onClick={() => {
        if (!confirm(tConfirm("deleteTransaction"))) return;
        startTransition(() => archiveTransactionAction(transactionId, workspaceId));
      }}
      disabled={isPending}
      className="text-sm text-neutral-400 transition hover:text-red-600 disabled:opacity-60"
    >
      {tCommon("delete")}
    </button>
  );
}
