"use client";

import { useActionState, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { formatMoney, fromMinorUnits } from "@/lib/money";
import {
  recordDebtPaymentAction,
  type RecordDebtPaymentState,
} from "@/features/debts/actions/record-debt-payment";
import type { DebtItem } from "@/features/debts/types";

const initialState: RecordDebtPaymentState = { error: null, success: false };

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function RecordDebtPaymentDialog({
  isOpen,
  onClose,
  debt,
  accounts,
  workspaceId,
  currency,
}: {
  isOpen: boolean;
  onClose: () => void;
  debt: DebtItem;
  accounts: { _id: string; name: string; currency?: string | null }[];
  workspaceId: string;
  currency: string;
}) {
  const t = useTranslations("forms.debts");
  const locale = useLocale();
  const formatOptions = {
    currency,
    locale: locale === "ar" ? "ar-EG" : "en-US",
  };
  const [state, formAction, isPending] = useActionState(
    recordDebtPaymentAction,
    initialState,
  );

  const remainingMajor = fromMinorUnits(debt.remainingAmount);
  const [amountInput, setAmountInput] = useState<string>(String(remainingMajor));
  const [idempotencyKey, setIdempotencyKey] = useState("");

  useEffect(() => {
    if (isOpen) {
      setAmountInput(String(fromMinorUnits(debt.remainingAmount)));
      setIdempotencyKey(crypto.randomUUID());
    }
  }, [isOpen, debt.remainingAmount]);

  useEffect(() => {
    if (state.success) {
      onClose();
    }
  }, [state.success, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">{t("recordPaymentTitle")}</h3>
            <p className="mt-0.5 text-xs text-neutral-500">
              {t("recordPaymentSubtitle", { name: debt.name, creditor: debt.creditor })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          >
            ✕
          </button>
        </div>

        {/* Debt Snapshot Badge */}
        <div className="mt-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs">
          <div>
            <span className="font-semibold text-amber-900">{t("remainingToPay")}</span>
            <p className="mt-0.5 text-base font-bold text-amber-950">
              {formatMoney(debt.remainingAmount, formatOptions)}
            </p>
          </div>
          <div className="text-end text-neutral-600">
            <span>{t("totalLiabilitySnapshot")} </span>
            <span className="font-semibold text-neutral-900">
              {formatMoney(debt.totalAmount, formatOptions)}
            </span>
          </div>
        </div>

        <form action={formAction} className="mt-4 space-y-4">
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
          <input type="hidden" name="debtId" value={debt.id} />

          {state.error && (
            <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700">
              {state.error}
            </div>
          )}

          {/* Amount */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-neutral-700">
                {t("paymentAmount", { currency })} *
              </label>
              <button
                type="button"
                onClick={() => setAmountInput(String(remainingMajor))}
                className="text-xs font-medium text-[#065F46] hover:underline"
              >
                {t("payFullBalance")}
              </button>
            </div>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={remainingMajor}
              name="amount"
              inputMode="decimal"
              dir="ltr"
              required
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-start font-mono text-base font-bold text-neutral-900 focus:border-[#065F46] focus:outline-hidden focus:ring-1 focus:ring-[#065F46]"
            />
          </div>

          {/* Account Selection */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700">
              {t("deductFromAccount")} *
            </label>
            <select
              name="accountId"
              required
              defaultValue={accounts[0]?._id}
              className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-[#065F46] focus:outline-hidden focus:ring-1 focus:ring-[#065F46]"
            >
              {accounts.map((acc) => (
                <option key={acc._id} value={acc._id}>
                  {acc.name} {acc.currency ? `(${acc.currency})` : ""}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-neutral-500">
              {t("autoExpenseHint")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Payment Date */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700">
                {t("paymentDate")} *
              </label>
              <input
                type="date"
                name="paymentDate"
                required
                defaultValue={todayIsoDate()}
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-[#065F46] focus:outline-hidden focus:ring-1 focus:ring-[#065F46]"
              />
            </div>

            {/* Reference */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700">
                {t("reference")}
              </label>
              <input
                type="text"
                name="reference"
                placeholder={t("referencePlaceholder")}
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-[#065F46] focus:outline-hidden focus:ring-1 focus:ring-[#065F46]"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700">
              {t("paymentNotes")}
            </label>
            <input
              type="text"
              name="notes"
              placeholder={t("paymentNotesPlaceholder")}
              className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-[#065F46] focus:outline-hidden focus:ring-1 focus:ring-[#065F46]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center rounded-lg bg-[#065F46] px-5 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-[#065F46]/90 disabled:opacity-50"
            >
              {isPending ? t("recordingPayment") : t("confirmPayment")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
