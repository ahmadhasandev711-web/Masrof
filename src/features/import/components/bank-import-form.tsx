"use client";

import { useActionState } from "react";

import {
  importBankCsvAction,
  type ImportBankCsvState,
} from "@/features/import/actions/import-bank-csv";
import { useTranslations } from "next-intl";

const initialState: ImportBankCsvState = { error: null, imported: 0 };

export function BankImportForm({
  workspaceId,
  accounts,
  expenseCategories,
}: {
  workspaceId: string;
  accounts: { id: string; name: string }[];
  expenseCategories: { id: string; name: string; displayName: string }[];
}) {
  const tForm = useTranslations("forms.import");
  const [state, formAction, isPending] = useActionState(importBankCsvAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6">
      <input type="hidden" name="workspaceId" value={workspaceId} />

      <p className="text-sm text-neutral-600">
        {tForm("hint")}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{tForm("account")}</span>
          <select name="accountId" required className="rounded-lg border border-neutral-300 px-3 py-2">
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">{tForm("expenseCategory")}</span>
          <select name="categoryId" required className="rounded-lg border border-neutral-300 px-3 py-2">
            {expenseCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.displayName}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{tForm("csvContent")}</span>
        <textarea
          name="csvText"
          rows={10}
          required
          dir="ltr"
          placeholder={tForm("csvPlaceholder")}
          className="rounded-lg border border-neutral-300 px-3 py-2 font-mono text-sm"
        />
      </label>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.imported > 0 && (
        <p className="text-sm text-emerald-700">{tForm("success", { count: state.imported })}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-lg bg-[#065F46] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {isPending ? tForm("importing") : tForm("submit")}
      </button>
    </form>
  );
}
