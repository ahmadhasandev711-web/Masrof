"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import {
  createTransferAction,
  type CreateTransferState,
} from "@/features/transfers/actions/create-transfer";
import { useTranslations } from "next-intl";

type AccountOption = { id: string; name: string };

const initialState: CreateTransferState = { error: null };

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function CreateTransferForm({
  workspaceId,
  accounts,
  onSuccess,
  onCancel,
}: {
  workspaceId: string;
  accounts: AccountOption[];
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const tForm = useTranslations("forms.transfer");
  const tCommon = useTranslations("common");
  const [state, formAction, isPending] = useActionState(createTransferAction, initialState);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setIdempotencyKey(crypto.randomUUID());
  }, []);

  useEffect(() => {
    if (!isPending && state.error === null && hasSubmitted) {
      formRef.current?.reset();
      setHasSubmitted(false);
      setIdempotencyKey(crypto.randomUUID());
      onSuccess?.();
    }
  }, [isPending, state.error, hasSubmitted, onSuccess]);

  const canTransfer = accounts.length >= 2;

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={() => setHasSubmitted(true)}
      className="flex flex-col gap-4 rounded-2xl border border-blue-100 dark:border-blue-500/25 bg-blue-50/30 dark:bg-[#161E1B] p-6 shadow-sm"
    >
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

      <div>
        <h2 className="font-semibold text-neutral-900 dark:text-[#ECEAE4]">{tForm("title")}</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-[#9AA39F]">{tForm("hint")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="from-account" className="text-sm font-medium text-neutral-700 dark:text-[#ECEAE4]">
            {tForm("fromAccount")}
          </label>
          <select
            id="from-account"
            name="fromAccountId"
            className="rounded-lg border border-neutral-300 dark:border-[#26302C] bg-white dark:bg-[#1E2824] dark:text-[#ECEAE4] px-3 py-2 text-right"
            defaultValue={accounts[0]?.id ?? ""}
            required
            disabled={!canTransfer}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="to-account" className="text-sm font-medium text-neutral-700 dark:text-[#ECEAE4]">
            {tForm("toAccount")}
          </label>
          <select
            id="to-account"
            name="toAccountId"
            className="rounded-lg border border-neutral-300 dark:border-[#26302C] bg-white dark:bg-[#1E2824] dark:text-[#ECEAE4] px-3 py-2 text-right"
            defaultValue={accounts[1]?.id ?? accounts[0]?.id ?? ""}
            required
            disabled={!canTransfer}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="transfer-amount" className="text-sm font-medium text-neutral-700 dark:text-[#ECEAE4]">
            {tForm("amount")}
          </label>
          <input
            id="transfer-amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            inputMode="decimal"
            dir="ltr"
            placeholder="0.00"
            className="rounded-lg border border-neutral-300 dark:border-[#26302C] bg-white dark:bg-[#1E2824] dark:text-[#ECEAE4] px-3 py-2 text-start font-mono text-base font-bold"
            required
            disabled={!canTransfer}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="transfer-date" className="text-sm font-medium text-neutral-700 dark:text-[#ECEAE4]">
            {tForm("date")}
          </label>
          <input
            id="transfer-date"
            name="transferDate"
            type="date"
            defaultValue={todayIsoDate()}
            className="rounded-lg border border-neutral-300 dark:border-[#26302C] bg-white dark:bg-[#1E2824] dark:text-[#ECEAE4] px-3 py-2 text-right"
            required
            disabled={!canTransfer}
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="transfer-description" className="text-sm font-medium text-neutral-700 dark:text-[#ECEAE4]">
            {tForm("description")}
          </label>
          <input
            id="transfer-description"
            name="description"
            type="text"
            placeholder={tCommon("optional")}
            className="rounded-lg border border-neutral-300 dark:border-[#26302C] bg-white dark:bg-[#1E2824] dark:text-[#ECEAE4] px-3 py-2 text-right"
            disabled={!canTransfer}
          />
        </div>
      </div>

      {!canTransfer && (
        <p className="text-sm text-amber-600 dark:text-amber-400">{tForm("needsTwoAccounts")}</p>
      )}

      {state.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending || !canTransfer}
          className="rounded-xl bg-blue-700 dark:bg-blue-600 px-5 py-2.5 font-medium text-white shadow-xs transition hover:bg-blue-800 dark:hover:bg-blue-500 disabled:opacity-60"
        >
          {isPending ? tCommon("saving") : tForm("submit")}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-xl border border-neutral-300 dark:border-[#26302C] px-4 py-2.5 font-medium text-neutral-700 dark:text-[#ECEAE4] transition hover:bg-neutral-100 dark:hover:bg-[#1E2824] disabled:opacity-60"
          >
            {tCommon("cancel")}
          </button>
        )}
      </div>
    </form>
  );
}
