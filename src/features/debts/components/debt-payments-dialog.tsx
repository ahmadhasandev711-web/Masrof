"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { formatMoney } from "@/lib/money";
import { getDebtPaymentsAction } from "@/features/debts/actions/get-debt-payments";
import type { DebtItem, DebtPaymentItem } from "@/features/debts/types";

export function DebtPaymentsDialog({
  isOpen,
  onClose,
  debt,
  workspaceId,
  currency,
}: {
  isOpen: boolean;
  onClose: () => void;
  debt: DebtItem;
  workspaceId: string;
  currency: string;
}) {
  const t = useTranslations("forms.debts");
  const locale = useLocale();
  const [payments, setPayments] = useState<DebtPaymentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    setIsLoading(true);
    setError(null);

    getDebtPaymentsAction(workspaceId, debt.id)
      .then((res) => {
        if (!active) return;
        if (res.success) {
          setPayments(res.payments);
        } else {
          setError(res.error);
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : t("loadingPayments"));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, workspaceId, debt.id, t]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-xl rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div>
            <h3 className="text-lg font-bold text-neutral-900">{t("historyTitle")}</h3>
            <p className="mt-0.5 text-xs text-neutral-500">
              {t("historySubtitle", { name: debt.name, creditor: debt.creditor })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          >
            
          </button>
        </div>

        {/* Summary Mini Bar */}
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-neutral-50 p-3 text-center text-xs">
          <div>
            <span className="text-neutral-500">{t("totalLiabilities")}:</span>
            <p className="font-bold text-neutral-900">{formatMoney(debt.totalAmount, { currency })}</p>
          </div>
          <div>
            <span className="text-emerald-700">{t("totalPaid")}:</span>
            <p className="font-bold text-emerald-800">{formatMoney(debt.paidAmount, { currency })}</p>
          </div>
          <div>
            <span className="text-amber-800">{t("remainingLiabilities")}:</span>
            <p className="font-bold text-amber-900">{formatMoney(debt.remainingAmount, { currency })}</p>
          </div>
        </div>

        {/* Payments List */}
        <div className="mt-4 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-neutral-400">{t("loadingPayments")}</div>
          ) : error ? (
            <div className="py-6 text-center text-xs text-red-600">{error}</div>
          ) : payments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-200 py-8 text-center">
              <span className="text-2xl"></span>
              <p className="mt-2 text-xs font-medium text-neutral-500">
                {t("noPaymentsYet")}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-900">
                        {new Date(p.paymentDate).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-600">
                        {p.accountName}
                      </span>
                      {p.reference && (
                        <span className="text-[10px] text-neutral-400">#{p.reference}</span>
                      )}
                    </div>
                    {p.notes && <p className="mt-0.5 text-[11px] text-neutral-500">{p.notes}</p>}
                  </div>
                  <div className="text-end">
                    <span className="font-bold text-emerald-800">
                      {formatMoney(p.amount, { currency })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-neutral-100 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-200"
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}
