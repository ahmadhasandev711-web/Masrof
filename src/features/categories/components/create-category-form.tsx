"use client";

import { useActionState, useRef, useEffect } from "react";
import {
  createCategoryAction,
  type CreateCategoryState,
} from "@/features/categories/actions/create-category";
import { useTranslations } from "next-intl";

const initialState: CreateCategoryState = { error: null };

export function CreateCategoryForm({ workspaceId }: { workspaceId: string }) {
  const tForm = useTranslations("forms.category");
  const tCommon = useTranslations("common");
  const [state, formAction, isPending] = useActionState(createCategoryAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!isPending && state.error === null) {
      formRef.current?.reset();
    }
  }, [isPending, state.error]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:flex-row sm:items-end"
    >
      <input type="hidden" name="workspaceId" value={workspaceId} />

      <div className="flex flex-1 flex-col gap-1.5">
        <label htmlFor="category-name" className="text-sm font-medium text-neutral-700">
            {tForm("name")}
        </label>
        <input
          id="category-name"
          name="name"
          type="text"
            placeholder={tForm("name")}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-right focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
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
          className="rounded-lg border border-neutral-300 px-3 py-2 text-right focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        >
          <option value="expense">{tForm("kindExpense")}</option>
          <option value="income">{tForm("kindIncome")}</option>
        </select>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600 sm:self-center">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white transition hover:bg-emerald-800 disabled:opacity-60"
      >
        {isPending ? tCommon("adding") : tForm("submit")}
      </button>
    </form>
  );
}
