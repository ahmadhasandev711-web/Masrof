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
      className="rounded-lg px-2 py-1 text-xs font-semibold text-neutral-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
    >
      {tCommon("delete")}
    </button>
  );
}
