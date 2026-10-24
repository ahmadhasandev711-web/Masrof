"use client";

import { useActionState, useRef, useEffect } from "react";
import { useIdempotencyKey } from "@/hooks/use-idempotency-key";
import { IdempotencyKeyInput } from "@/components/idempotency-key-input";
import {
  createCategoryAction,
  type CreateCategoryState,
} from "@/features/categories/actions/create-category";
import { useTranslations } from "next-intl";

const initialState: CreateCategoryState = { error: null };

export function CreateCategoryForm({
  workspaceId,
  onSuccess,
  onCancel,
  showTitle = true,
}: {
  workspaceId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  showTitle?: boolean;
}) {
  const tForm = useTranslations("forms.category");
  const tCommon = useTranslations("common");
  const [state, formAction, isPending] = useActionState(createCategoryAction, initialState);
  const { idempotencyKey, regenerateIdempotencyKey } = useIdempotencyKey();
  const formRef = useRef<HTMLFormElement>(null);
  const hasSubmitted = useRef(false);

  useEffect(() => {
    if (hasSubmitted.current && !isPending && state.error === null) {
      formRef.current?.reset();
      hasSubmitted.current = false;
      onSuccess?.();
    }
  }, [isPending, state.error, onSuccess]);

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={() => {
        hasSubmitted.current = true;
      }}
      className={
        showTitle
          ? "flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
          : "flex flex-col gap-4"
      }
    >
      {showTitle && (
        <h2 className="text-base font-semibold text-neutral-900">{tForm("title")}</h2>
      )}

      <input type="hidden" name="workspaceId" value={workspaceId} />
      <IdempotencyKeyInput value={idempotencyKey} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="category-name" className="text-sm font-medium text-neutral-700">
          {tForm("name")}
        </label>
        <input
          id="category-name"
          name="name"
          type="text"
          placeholder={tForm("name")}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-start focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="category-kind" className="text-sm font-medium text-neutral-700">
          {tForm("kind")}
        </label>
        <select
          id="category-kind"
          name="kind"
          defaultValue="expense"
          className="rounded-lg border border-neutral-300 px-3 py-2 text-start focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        >
          <option value="expense">{tForm("kindExpense")}</option>
          <option value="income">{tForm("kindIncome")}</option>
        </select>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-60"
          >
            {tCommon("cancel")}
          </button>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-emerald-700 px-5 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-emerald-800 disabled:opacity-60"
        >
          {isPending ? tCommon("adding") : tForm("submit")}
        </button>
      </div>
    </form>
  );
}
