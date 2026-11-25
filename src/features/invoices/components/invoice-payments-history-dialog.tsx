"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import { formatMoney } from "@/lib/money";
import { getInvoicePaymentsAction } from "@/features/invoices/actions/get-invoice-payments";
import { voidInvoicePaymentAction } from "@/features/invoices/actions/void-payment";
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
  canWrite = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceListItem;
  workspaceId: string;
  currency: string;
  canWrite?: boolean;
}) {
  const t = useTranslations("forms.invoice");
  const tCommon = useTranslations("common");
  const tMethods = useTranslations("forms.paymentMethods");

  const [payments, setPayments] = useState<InvoicePaymentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function load() {
    setLoading(true);
    void getInvoicePaymentsAction(invoice._id, workspaceId).then((res) => {
      setPayments(res.payments);
      setLoading(false);
    });
  }

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, invoice._id, workspaceId]);

  function voidPayment(paymentId: string) {
    if (!window.confirm(t("voidPaymentConfirm"))) return;
    setVoidingId(paymentId);
    setError(null);
    startTransition(async () => {
      const res = await voidInvoicePaymentAction(paymentId, workspaceId);
      setVoidingId(null);
      if (res.error) {
        setError(res.error);
        return;
      }
      load();
      router.refresh();
    });
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${t("paymentHistory")} — ${invoice.invoiceNumber}`}
      maxWidthClassName="max-w-lg"
    >
      <div className="flex flex-col gap-4">
        {loading ? (
          <p className="py-8 text-center text-sm text-neutral-400 dark:text-[#9AA39F]">{tCommon("loading")}</p>
        ) : payments.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-400 dark:text-[#9AA39F]">{t("noPaymentsRecorded")}</p>
        ) : (
          <div className="flex flex-col gap-2 overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-[#26302C] text-xs text-neutral-500 dark:text-[#9AA39F]">
                  <th className="pb-2 font-medium">{t("paymentDate")}</th>
                  <th className="pb-2 font-medium">{t("depositAccount")}</th>
                  <th className="pb-2 font-medium">{t("paymentMethod")}</th>
                  <th className="pb-2 text-left font-medium">{t("paymentAmount")}</th>
                  {canWrite && <th className="pb-2" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-[#26302C]">
                {payments.map((p) => (
                  <tr key={p._id} className="text-neutral-700 dark:text-[#ECEAE4]">
                    <td className="py-2.5 text-xs text-neutral-600 dark:text-[#9AA39F]">{formatDate(p.paymentDate)}</td>
                    <td className="py-2.5">{p.accountName || "—"}</td>
                    <td className="py-2.5 text-xs text-neutral-500 dark:text-[#9AA39F]">
                      {tMethods(p.paymentMethod as any) || p.paymentMethod}
                      {p.reference ? ` (${p.reference})` : ""}
                    </td>
                    <td className="py-2.5 text-left font-semibold text-emerald-800 dark:text-[#34D399]">
                      {formatMoney(p.amount, { currency })}
                    </td>
                    {canWrite && (
                      <td className="py-2.5 ps-2 text-left">
                        <button
                          type="button"
                          disabled={voidingId === p._id}
                          onClick={() => voidPayment(p._id)}
                          className="rounded-lg border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/15 px-2 py-1 text-xs font-semibold text-rose-800 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/25 disabled:opacity-60"
                        >
                          {voidingId === p._id ? t("voidingPayment") : t("voidPayment")}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-rose-700 dark:text-rose-400">
            {error}
          </p>
        )}

        <div className="mt-4 flex justify-end border-t border-neutral-100 dark:border-[#26302C] pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-300 dark:border-[#26302C] px-4 py-2 text-sm font-medium text-neutral-700 dark:text-[#ECEAE4] hover:bg-neutral-50 dark:hover:bg-[#1E2824]"
          >
            {tCommon("close")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
