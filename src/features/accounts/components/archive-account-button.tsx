"use client";

import { useTransition } from "react";
import { archiveAccountAction } from "@/features/accounts/actions/archive-account";
import { useTranslations } from "next-intl";

export function ArchiveAccountButton({
  accountId,
  workspaceId,
}: {
  accountId: string;
  workspaceId: string;
}) {
  const tConfirm = useTranslations("confirm");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        if (!confirm(tConfirm("archiveAccount"))) return;
        startTransition(() => archiveAccountAction(accountId, workspaceId));
      }}
      disabled={isPending}
      className="text-sm text-neutral-400 transition hover:text-red-600 disabled:opacity-60"
    >
      {tCommon("archive")}
    </button>
  );
}
