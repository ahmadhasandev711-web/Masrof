"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  updateTransactionAction,
  type UpdateTransactionState,
} from "@/features/transactions/actions/update-transaction";
import { useTranslations } from "next-intl";
import type { CategoryOption } from "@/features/categories/map-options";
import { MOBILE_FIELD } from "@/components/ui/mobile-field";

type AccountOption = { id: string; name: string };

export type EditableTransaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  transactionDate: string;
  description: string;
  notes: string;
  accountId: string;
  categoryId: string;
};

const initialState: UpdateTransactionState = { error: null, success: false };

export function EditTransactionForm({
  transaction,
  workspaceId,
  accounts,
  categories,
  onCancel,
  onSuccess,
}: {
  transaction: EditableTransaction;
  workspaceId: string;
  accounts: AccountOption[];
  categories: CategoryOption[];
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const tForm = useTranslations("forms.transaction");
  const tCommon = useTranslations("common");
  const [state, formAction, isPending] = useActionState(updateTransactionAction, initialState);
  const [type, setType] = useState(transaction.type);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.kind === type),
    [categories, type],
  );

  useEffect(() => {
    if (state.success) {
      onSuccess();
    }
  }, [state.success, onSuccess]);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="transactionId" value={transaction.id} />
      <input type="hidden" name="workspaceId" value={workspaceId} />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType("expense")}
          className={`flex-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
            type === "expense"
              ? "border-red-300 dark:border-rose-500/40 bg-red-50 dark:bg-rose-500/15 text-red-700 dark:text-rose-400"
              : "border-neutral-200 dark:border-[#26302C] bg-white dark:bg-[#1E2824] text-neutral-500 dark:text-[#9AA39F]"
          }`}
        >
          {tForm("expense")}
        </button>
        <button
          type="button"
          onClick={() => setType("income")}
          className={`flex-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
            type === "income"
              ? "border-emerald-300 dark:border-[#34D399]/40 bg-emerald-50 dark:bg-[#0F2E24] text-emerald-700 dark:text-[#34D399]"
              : "border-neutral-200 dark:border-[#26302C] bg-white dark:bg-[#1E2824] text-neutral-500 dark:text-[#9AA39F]"
          }`}
        >
          {tForm("income")}
        </button>
        <input type="hidden" name="type" value={type} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-neutral-600 dark:text-[#9AA39F]">{tForm("amount")}</label>
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            inputMode="decimal"
            enterKeyHint="done"
            defaultValue={transaction.amount}
            className={`${MOBILE_FIELD} bg-white dark:bg-[#1E2824] text-right`}
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-neutral-600 dark:text-[#9AA39F]">{tForm("date")}</label>
          <input
            name="transactionDate"
            type="date"
            defaultValue={transaction.transactionDate}
            className={`${MOBILE_FIELD} bg-white dark:bg-[#1E2824] text-right`}
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-neutral-600 dark:text-[#9AA39F]">{tForm("account")}</label>
          <select
            name="accountId"
            defaultValue={transaction.accountId}
            className={`${MOBILE_FIELD} bg-white dark:bg-[#1E2824] text-right`}
            required
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-neutral-600 dark:text-[#9AA39F]">{tForm("category")}</label>
          <select
            name="categoryId"
            defaultValue={transaction.categoryId}
            className={`${MOBILE_FIELD} bg-white dark:bg-[#1E2824] text-right`}
            required
          >
            {filteredCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.displayName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-xs font-medium text-neutral-600 dark:text-[#9AA39F]">{tForm("descriptionOptional")}</label>
          <input
            name="description"
            type="text"
            defaultValue={transaction.description}
            className={`${MOBILE_FIELD} bg-white dark:bg-[#1E2824] text-right`}
          />
        </div>

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-xs font-medium text-neutral-600 dark:text-[#9AA39F]">{tForm("notesOptional")}</label>
          <textarea
            name="notes"
            rows={2}
            defaultValue={transaction.notes}
            className={`${MOBILE_FIELD} bg-white dark:bg-[#1E2824] text-right`}
          />
        </div>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-emerald-700 dark:bg-[#10B981] px-4 py-2 text-sm font-medium text-white dark:text-[#04231A] hover:bg-emerald-800 dark:hover:bg-[#34D399] disabled:opacity-60"
        >
          {isPending ? tCommon("saving") : tCommon("saveChanges")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-neutral-300 dark:border-[#26302C] bg-white dark:bg-[#1E2824] px-4 py-2 text-sm text-neutral-600 dark:text-[#9AA39F] hover:bg-neutral-50 dark:hover:bg-[#26302C]"
        >
          {tCommon("cancel")}
        </button>
      </div>
    </form>
  );
}
