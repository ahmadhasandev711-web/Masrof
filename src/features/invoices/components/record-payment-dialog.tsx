"use client";

import { useActionState, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { formatMoney, fromMinorUnits } from "@/lib/money";
import {
  recordInvoicePaymentAction,
  type RecordPaymentState,
} from "@/features/invoices/actions/record-payment";
import type { InvoiceListItem } from "@/features/invoices/types";

const initialState: RecordPaymentState = { error: null, success: false };

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function RecordPaymentDialog({
  isOpen,
  onClose,
  invoice,
  accounts,
  workspaceId,
  currency,
}: {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceListItem;
  accounts: { _id: string; name: string; currency?: string | null }[];
  workspaceId: string;
  currency: string;
}) {
  const t = useTranslations("forms.invoice");
  const tCommon = useTranslations("common");
  const tMethods = useTranslations("forms.paymentMethods");

  const [state, formAction, isPending] = useActionState(
    recordInvoicePaymentAction,
    initialState,
  );

  const [idempotencyKey, setIdempotencyKey] = useState("");
  const remainingMajor = fromMinorUnits(invoice.remainingAmount);
  const [amountInput, setAmountInput] = useState<string>(String(remainingMajor));

  useEffect(() => {
    if (isOpen) {
      setIdempotencyKey(crypto.randomUUID());
      setAmountInput(String(fromMinorUnits(invoice.remainingAmount)));
    }
  }, [isOpen, invoice.remainingAmount]);

  useEffect(() => {
    if (state.success) {
      onClose();
    }
  }, [state.success, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h3 className="text-lg font-semibold text-neutral-900">
            {t("recordPayment")} — {invoice.invoiceNumber}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600"
          >
            ✕
          </button>
        </div>

        {/* Invoice Summary Box */}
        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-neutral-50 p-3 text-sm">
          <div>
            <span className="text-neutral-500">{t("total")}: </span>
            <span className="font-semibold text-neutral-900">
              {formatMoney(invoice.total, { currency })}
            </span>
          </div>
          <div>
            <span className="text-neutral-500">{t("paidAmount")}: </span>
            <span className="font-semibold text-emerald-700">
              {formatMoney(invoice.paidAmount, { currency })}
            </span>
          </div>
          <div className="col-span-2 border-t border-neutral-200/60 pt-2">
            <span className="text-neutral-500">{t("remainingAmount")}: </span>
            <span className="font-bold text-emerald-800">
              {formatMoney(invoice.remainingAmount, { currency })}
            </span>
          </div>
        </div>

        <form action={formAction} className="mt-4 flex flex-col gap-4">
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <input type="hidden" name="invoiceId" value={invoice._id} />
          <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

          {/* Amount field */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="payment-amount" className="text-sm font-medium text-neutral-700">
                {t("paymentAmount")} ({currency})
              </label>
              <button
                type="button"
                onClick={() => setAmountInput(String(remainingMajor))}
                className="text-xs font-medium text-emerald-700 hover:underline"
              >
                {t("fullPayment")}
              </button>
            </div>
            <input
              id="payment-amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={remainingMajor}
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-right text-base font-semibold"
              required
            />
          </div>

          {/* Account select */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="payment-account" className="text-sm font-medium text-neutral-700">
              {t("depositAccount")}
            </label>
            <select
              id="payment-account"
              name="accountId"
              defaultValue={accounts[0]?._id ?? ""}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-right text-sm"
              required
            >
              {accounts.map((acc) => (
                <option key={acc._id} value={acc._id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* Payment date */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="payment-date" className="text-sm font-medium text-neutral-700">
                {t("paymentDate")}
              </label>
              <input
                id="payment-date"
                name="paymentDate"
                type="date"
                defaultValue={todayIsoDate()}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-right text-sm"
                required
              />
            </div>

            {/* Payment method */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="payment-method" className="text-sm font-medium text-neutral-700">
                {t("paymentMethod")}
              </label>
              <select
                id="payment-method"
                name="paymentMethod"
                defaultValue="bank_transfer"
                className="rounded-lg border border-neutral-300 px-3 py-2 text-right text-sm"
              >
                <option value="bank_transfer">{tMethods("bank_transfer")}</option>
                <option value="cash">{tMethods("cash")}</option>
                <option value="card">{tMethods("card")}</option>
                <option value="check">{tMethods("check")}</option>
                <option value="other">{tMethods("other")}</option>
              </select>
            </div>
          </div>

          {/* Reference & Notes */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="payment-reference" className="text-sm font-medium text-neutral-700">
              {t("reference")}
            </label>
            <input
              id="payment-reference"
              name="reference"
              type="text"
              placeholder={t("referencePlaceholder")}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-right text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="payment-notes" className="text-sm font-medium text-neutral-700">
              {t("notes")}
            </label>
            <input
              id="payment-notes"
              name="notes"
              type="text"
              placeholder={t("notesPlaceholderShort")}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-right text-sm"
            />
          </div>

          {state.error && (
            <p role="alert" className="text-sm text-red-600">
              {state.error}
            </p>
          )}

          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              {tCommon("cancel")}
            </button>
            <button
              type="submit"
              disabled={isPending || accounts.length === 0}
              className="rounded-lg bg-emerald-700 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {isPending ? tCommon("saving") : t("confirmPayment")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
