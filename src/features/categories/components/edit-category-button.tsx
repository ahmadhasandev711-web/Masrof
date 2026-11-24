"use client";

import { useActionState, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import { MOBILE_FIELD } from "@/components/ui/mobile-field";
import {
  updateCategoryAction,
  type UpdateCategoryState,
} from "@/features/categories/actions/update-category";

const initialState: UpdateCategoryState = { error: null, success: false };

/** Rename a custom category. Kind stays fixed because existing transactions depend on it. */
export function EditCategoryButton({
  categoryId,
  workspaceId,
  name,
  nameEn,
}: {
  categoryId: string;
  workspaceId: string;
  name: string;
  nameEn: string;
}) {
  const tForm = useTranslations("forms.category");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-neutral-500 transition hover:text-emerald-700"
      >
        {tCommon("edit")}
      </button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title={tForm("editTitle")} maxWidthClassName="max-w-md">
        {open && (
          <EditCategoryForm
            categoryId={categoryId}
            workspaceId={workspaceId}
            name={name}
            nameEn={nameEn}
            onDone={() => setOpen(false)}
          />
        )}
      </Modal>
    </>
  );
}

function EditCategoryForm({
  categoryId,
  workspaceId,
  name,
  nameEn,
  onDone,
}: {
  categoryId: string;
  workspaceId: string;
  name: string;
  nameEn: string;
  onDone: () => void;
}) {
  const tForm = useTranslations("forms.category");
  const tCommon = useTranslations("common");
  const [state, formAction, isPending] = useActionState(updateCategoryAction, initialState);

  useEffect(() => {
    if (state.success) onDone();
  }, [state.success, onDone]);

  const field = `${MOBILE_FIELD} bg-white text-start focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100`;

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <input type="hidden" name="categoryId" value={categoryId} />
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-neutral-700">{tForm("nameAr")}</label>
        <input name="name" defaultValue={name} required className={field} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-neutral-700">
          {tForm("nameEn")}{" "}
          <span className="font-normal text-neutral-400">({tForm("nameEnOptional")})</span>
        </label>
        <input name="nameEn" defaultValue={nameEn} placeholder={tForm("nameEnPlaceholder")} className={field} />
        <p className="text-xs text-neutral-500">{tForm("nameEnHint")}</p>
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:opacity-60"
        >
          {isPending ? tCommon("saving") : tCommon("saveChanges")}
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={isPending}
          className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-60"
        >
          {tCommon("cancel")}
        </button>
      </div>
    </form>
  );
}
