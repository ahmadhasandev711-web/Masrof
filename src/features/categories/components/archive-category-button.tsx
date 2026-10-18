"use client";

import { useState, useTransition } from "react";
import { archiveCategoryAction } from "@/features/categories/actions/archive-category";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTranslations } from "next-intl";

export function ArchiveCategoryButton({
  categoryId,
  workspaceId,
}: {
  categoryId: string;
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
        {tCommon("archive")}
      </button>

      <ConfirmDialog
        open={open}
        title={tCommon("confirmation")}
        message={tConfirm("archiveCategory")}
        confirmLabel={tCommon("archive")}
        pendingLabel={tCommon("archiving")}
        tone="danger"
        isPending={isPending}
        onConfirm={() => {
          startTransition(async () => {
            await archiveCategoryAction(categoryId, workspaceId);
            setOpen(false);
          });
        }}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
