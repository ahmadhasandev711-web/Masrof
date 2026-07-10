"use client";

import { useActionState, useRef, useEffect } from "react";
import {
  createBudgetAction,
  type CreateBudgetState,
} from "@/features/budgets/actions/create-budget";
import { useTranslations } from "next-intl";

type CategoryOption = { id: string; name: string; icon?: string | null };

const initialState: CreateBudgetState = { error: null };

export function CreateBudgetForm({
  workspaceId,
  expenseCategories,
}: {
  workspaceId: string;
  expenseCategories: CategoryOption[];
}) {
  const tForm = useTranslations("forms.budget");
  const tCommon = useTranslations("common");
  const [state, formAction, isPending] = useActionState(createBudgetAction, initialState);
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
      className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
    >
      <input type="hidden" name="workspaceId" value={workspaceId} />

      <h2 className="font-semibold text-neutral-900">{tForm("title")}</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="budget-name" className="text-sm font-medium text-neutral-700">
            {tForm("name")}
          </label>
          <input
            id="budget-name"
            name="name"
            type="text"
            placeholder={tForm("namePlaceholder")}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-right focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="budget-category" className="text-sm font-medium text-neutral-700">
            {tForm("categoryOptional")}
          </label>
          <select
            id="budget-category"
            name="categoryId"
            defaultValue=""
            className="rounded-lg border border-neutral-300 px-3 py-2 text-right focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">{tForm("wholeWorkspace")}</option>
            {expenseCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon ?? ""} {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="budget-amount" className="text-sm font-medium text-neutral-700">
            {tForm("monthlyLimit")}
          </label>
          <input
            id="budget-amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-right focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            required
          />
        </div>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white transition hover:bg-emerald-800 disabled:opacity-60"
      >
        {isPending ? tCommon("adding") : tForm("submit")}
      </button>
    </form>
  );
}
