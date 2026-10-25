"use client";

import { useActionState, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { useIdempotencyKey } from "@/hooks/use-idempotency-key";
import { IdempotencyKeyInput } from "@/components/idempotency-key-input";
import { useTranslations } from "next-intl";
import {
  createDebtAction,
  type CreateDebtState,
} from "@/features/debts/actions/create-debt";

const initialState: CreateDebtState = { error: null, success: false };

export function CreateDebtDialog({
  workspaceId,
  currency,
}: {
  workspaceId: string;
  currency: string;
}) {
  const t = useTranslations("forms.debts");
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createDebtAction, initialState);
  const { idempotencyKey, regenerateIdempotencyKey } = useIdempotencyKey();

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setIsOpen(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [searchParams]);

  useEffect(() => {
    if (state.success) {
      regenerateIdempotencyKey();
      setIsOpen(false);
    }
  }, [state.success, regenerateIdempotencyKey]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl bg-[#065F46] px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#065F46]/90 active:scale-[0.98]"
      >
        <span className="text-base leading-none">＋</span>
        <span>{t("addDebt")}</span>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={t("addDebtTitle")}
        subtitle={t("addDebtSubtitle")}
        maxWidthClassName="max-w-lg"
      >
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <IdempotencyKeyInput value={idempotencyKey} />

          {/* Type: I owe / Owed to me */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-neutral-700">
              {t("debtType")}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50/50 p-2.5 text-xs font-medium text-neutral-800 transition has-[:checked]:border-rose-400 has-[:checked]:bg-rose-50 has-[:checked]:text-rose-900">
                <input
                  type="radio"
                  name="type"
                  value="payable"
                  defaultChecked
                  className="accent-rose-600"
                />
                <span>{t("typePayable")}</span>
              </label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50/50 p-2.5 text-xs font-medium text-neutral-800 transition has-[:checked]:border-emerald-400 has-[:checked]:bg-emerald-50 has-[:checked]:text-emerald-900">
                <input
                  type="radio"
                  name="type"
                  value="receivable"
                  className="accent-[#065F46]"
                />
                <span>{t("typeReceivable")}</span>
              </label>
            </div>
          </div>

          {/* Debt Name/Title */}
          <div>
            <label htmlFor="debt-name" className="mb-1 block text-xs font-semibold text-neutral-700">
              {t("debtName")} <span className="text-rose-500">*</span>
            </label>
            <input
              id="debt-name"
              name="name"
              type="text"
              required
              placeholder={t("debtNamePlaceholder")}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-[#065F46] focus:ring-1 focus:ring-[#065F46]"
            />
          </div>

          {/* Creditor/Debtor Person or Entity */}
          <div>
            <label htmlFor="debt-creditor" className="mb-1 block text-xs font-semibold text-neutral-700">
              {t("creditor")} <span className="text-rose-500">*</span>
            </label>
            <input
              id="debt-creditor"
              name="creditor"
              type="text"
              required
              placeholder={t("creditorPlaceholder")}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-[#065F46] focus:ring-1 focus:ring-[#065F46]"
            />
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="debt-amount" className="mb-1 block text-xs font-semibold text-neutral-700">
              {t("amount")} ({currency}) <span className="text-rose-500">*</span>
            </label>
            <input
              id="debt-amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-[#065F46] focus:ring-1 focus:ring-[#065F46]"
            />
          </div>

          {/* Due Date (Optional) */}
          <div>
            <label htmlFor="debt-dueDate" className="mb-1 block text-xs font-semibold text-neutral-700">
              {t("dueDate")}
            </label>
            <input
              id="debt-dueDate"
              name="dueDate"
              type="date"
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-[#065F46] focus:ring-1 focus:ring-[#065F46]"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="debt-notes" className="mb-1 block text-xs font-semibold text-neutral-700">
              {t("notes")}
            </label>
            <textarea
              id="debt-notes"
              name="notes"
              rows={2}
              placeholder={t("notesPlaceholder")}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-[#065F46] focus:ring-1 focus:ring-[#065F46]"
            />
          </div>

          {state.error && (
            <p role="alert" className="text-xs font-medium text-rose-600">
              {state.error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center rounded-lg bg-[#065F46] px-5 py-2 text-sm font-semibold text-white shadow-xs transition hover:bg-[#065F46]/90 disabled:opacity-50"
            >
              {isPending ? t("saving") : t("save")}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
