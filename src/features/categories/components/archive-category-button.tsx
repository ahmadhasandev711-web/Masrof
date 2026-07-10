"use client";

import { useTransition } from "react";
import { archiveCategoryAction } from "@/features/categories/actions/archive-category";
import { useTranslations } from "next-intl";

export function ArchiveCategoryButton({
  categoryId,
  workspaceId,
}: {
  categoryId: string;
  workspaceId: string;
}) {
  const tConfirm = useTranslations("confirm");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        if (!confirm(tConfirm("archiveCategory"))) return;
        startTransition(() => archiveCategoryAction(categoryId, workspaceId));
      }}
      disabled={isPending}
      className="text-xs text-neutral-400 transition hover:text-red-600 disabled:opacity-60"
    >
      {tCommon("archive")}
    </button>
  );
}
