"use client";

import { useActionState, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

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

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Dialog Body / Bottom Sheet */}
          <div className="relative z-10 w-full max-w-lg max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain rounded-t-3xl sm:rounded-2xl border-t sm:border border-neutral-200 bg-white p-5 pb-[max(1.75rem,calc(1.25rem+env(safe-area-inset-bottom,0px)))] sm:p-6 shadow-xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-neutral-300 sm:hidden" />
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">
                  {t("addDebtTitle")}
                </h3>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {t("addDebtSubtitle")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
              >
                ✕
              </button>
            </div>

            <form action={formAction} className="mt-4 space-y-4">
              <input type="hidden" name="workspaceId" value={workspaceId} />
      <IdempotencyKeyInput value={idempotencyKey} />

              {state.error && (
                <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700">
                  {state.error}
                </div>
              )}

              {/* Debt Name */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700">
                  {t("name")} *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder={t("namePlaceholder")}
                  className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-[#065F46] focus:outline-hidden focus:ring-1 focus:ring-[#065F46]"
                />
              </div>

              {/* Creditor */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700">
                  {t("creditor")} *
                </label>
                <input
                  type="text"
                  name="creditor"
                  required
                  placeholder={t("creditorPlaceholder")}
                  className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-[#065F46] focus:outline-hidden focus:ring-1 focus:ring-[#065F46]"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Total Amount */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700">
                    {t("totalAmount", { currency })} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    name="amount"
                    inputMode="decimal"
                    dir="ltr"
                    required
                    placeholder="0.00"
                    className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-[#065F46] focus:outline-hidden focus:ring-1 focus:ring-[#065F46] font-mono"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700">
                    {t("dueDate")}
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-[#065F46] focus:outline-hidden focus:ring-1 focus:ring-[#065F46]"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700">
                  {t("category")}
                </label>
                <input
                  type="text"
                  name="category"
                  placeholder={t("categoryPlaceholder")}
                  className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-[#065F46] focus:outline-hidden focus:ring-1 focus:ring-[#065F46]"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700">
                  {t("notes")}
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder={t("notesPlaceholder")}
                  className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-[#065F46] focus:outline-hidden focus:ring-1 focus:ring-[#065F46]"
                />
              </div>

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
          </div>
        </div>
      )}
    </>
  );
}
