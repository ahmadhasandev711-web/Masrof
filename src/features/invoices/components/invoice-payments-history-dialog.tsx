"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { formatMoney } from "@/lib/money";
import { getInvoicePaymentsAction } from "@/features/invoices/actions/get-invoice-payments";
import type { InvoiceListItem, InvoicePaymentListItem } from "@/features/invoices/types";

function formatDate(isoDate: string) {
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(isoDate));
}

export function InvoicePaymentsHistoryDialog({
  isOpen,
  onClose,
  invoice,
  workspaceId,
  currency,
}: {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceListItem;
  workspaceId: string;
  currency: string;
}) {
  const t = useTranslations("forms.invoice");
  const tCommon = useTranslations("common");
  const tMethods = useTranslations("forms.paymentMethods");

  const [payments, setPayments] = useState<InvoicePaymentListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    void getInvoicePaymentsAction(invoice._id, workspaceId).then((res) => {
      setPayments(res.payments);
      setLoading(false);
    });
  }, [isOpen, invoice._id, workspaceId]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div className="relative native-bottom-sheet w-full max-w-lg max-h-[85svh] will-change-transform flex flex-col rounded-2xl bg-white p-6 shadow-xl overscroll-contain">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h3 className="text-lg font-semibold text-neutral-900">
            {t("paymentHistory")} — {invoice.invoiceNumber}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600"
          >
            ✕
          </button>
        </div>

        <div className="mt-4">
          {loading ? (
            <p className="py-8 text-center text-sm text-neutral-400">{tCommon("loading")}</p>
          ) : payments.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-400">{t("noPaymentsRecorded")}</p>
          ) : (
            <div className="flex flex-col gap-2 overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-xs text-neutral-500">
                    <th className="pb-2 font-medium">{t("paymentDate")}</th>
                    <th className="pb-2 font-medium">{t("depositAccount")}</th>
                    <th className="pb-2 font-medium">{t("paymentMethod")}</th>
                    <th className="pb-2 text-left font-medium">{t("paymentAmount")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {payments.map((p) => (
                    <tr key={p._id} className="text-neutral-700">
                      <td className="py-2.5 text-xs text-neutral-600">{formatDate(p.paymentDate)}</td>
                      <td className="py-2.5">{p.accountName || "—"}</td>
                      <td className="py-2.5 text-xs text-neutral-500">
                        {tMethods(p.paymentMethod as any) || p.paymentMethod}
                        {p.reference ? ` (${p.reference})` : ""}
                      </td>
                      <td className="py-2.5 text-left font-semibold text-emerald-800">
                        {formatMoney(p.amount, { currency })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end border-t border-neutral-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            {tCommon("close")}
          </button>
        </div>
      </div>
    </div>
  );
}
