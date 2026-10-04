"use client";

import { useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import type { InvoiceListItem, InvoiceFinancialStatus } from "@/features/invoices/types";
import type { InvoiceDisplayStatus } from "@/features/invoices/status";
import { RecordPaymentDialog } from "@/features/invoices/components/record-payment-dialog";
import { InvoicePaymentsHistoryDialog } from "@/features/invoices/components/invoice-payments-history-dialog";
import { InvoiceShareDialog } from "@/features/invoices/components/invoice-share-dialog";
import { useTranslations } from "next-intl";

function formatDate(isoDate: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(isoDate));
}

function statusClass(status: InvoiceDisplayStatus) {
  switch (status) {
    case "paid":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "overdue":
      return "bg-red-50 text-red-700 border-red-200";
    case "draft":
      return "bg-neutral-100 text-neutral-600 border-neutral-200";
    case "cancelled":
      return "bg-neutral-100 text-neutral-500 border-neutral-200 line-through";
    default:
      return "bg-sky-50 text-sky-800 border-sky-200";
  }
}

function financialStatusClass(status: InvoiceFinancialStatus) {
  switch (status) {
    case "paid":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "partially_paid":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "legacy_paid":
      return "bg-neutral-100 text-neutral-700 border-neutral-300";
    default:
      return "bg-neutral-50 text-neutral-600 border-neutral-200";
  }
}

export function InvoiceList({
  invoices,
  currency,
  workspaceId,
  workspaceName = "",
  canUseWhatsApp = false,
  accounts = [],
}: {
  invoices: InvoiceListItem[];
  currency: string;
  workspaceId: string;
  workspaceName?: string;
  canUseWhatsApp?: boolean;
  accounts?: { _id: string; name: string; currency?: string | null }[];
}) {
  const tEmpty = useTranslations("empty");
  const tStatus = useTranslations("forms.invoiceStatus");
  const tForm = useTranslations("forms.invoice");

  if (invoices.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-400">
        {tEmpty("noInvoices")}
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {invoices.map((invoice) => (
        <InvoiceRow
          key={invoice._id}
          invoice={invoice}
          currency={currency}
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          canUseWhatsApp={canUseWhatsApp}
          accounts={accounts}
          tStatus={tStatus}
          tForm={tForm}
        />
      ))}
    </ul>
  );
}

function InvoiceRow({
  invoice,
  currency,
  workspaceId,
  workspaceName,
  canUseWhatsApp,
  accounts,
  tStatus,
  tForm,
}: {
  invoice: InvoiceListItem;
  currency: string;
  workspaceId: string;
  workspaceName: string;
  canUseWhatsApp: boolean;
  accounts: { _id: string; name: string; currency?: string | null }[];
  tStatus: ReturnType<typeof useTranslations>;
  tForm: ReturnType<typeof useTranslations>;
}) {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  return (
    <>
      <li className="flex flex-col gap-3.5 rounded-2xl border border-neutral-200/90 bg-white p-4 sm:p-5 shadow-xs transition hover:shadow-sm">
        {/* Top Header: Invoice # & Status Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm sm:text-base font-bold text-[#065F46]">
              {invoice.invoiceNumber}
            </span>
            {invoice.viewedAt && (
              <span
                title={new Date(invoice.viewedAt).toLocaleString("ar-EG")}
                className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-800"
              >
                <span>✓✓</span>
                <span>{tForm("viewedBadge")}</span>
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusClass(invoice.displayStatus)}`}
            >
              {tStatus(invoice.displayStatus)}
            </span>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${financialStatusClass(invoice.financialStatus)}`}
            >
              {tForm(`financialStatuses.${invoice.financialStatus}`)}
            </span>
          </div>
        </div>

        {/* Client & Date Details */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 text-xs">👤</span>
            <p className="font-semibold text-neutral-900 text-sm sm:text-base">
              {invoice.clientName}
              {invoice.projectName ? (
                <span className="ms-1.5 font-normal text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md">
                  {invoice.projectName}
                </span>
              ) : null}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
            <span>📅 {formatDate(invoice.issueDate)}</span>
            {invoice.dueDate ? (
              <span className="text-neutral-600 font-medium">
                ⏳ {tForm("dueDate")}: {formatDate(invoice.dueDate)}
              </span>
            ) : null}
          </div>
        </div>

        {/* Financial Amount Box */}
        <div className="rounded-xl bg-[#FBF9F4] p-3 border border-[#E4DFD3]/70 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] text-neutral-500">{tForm("total") || "إجمالي الفاتورة"}</p>
            <p className="text-base sm:text-lg font-bold text-neutral-900">
              {formatMoney(invoice.total, { currency })}
            </p>
          </div>
          {invoice.financialStatus === "partially_paid" && (
            <div className="text-left rtl:text-right text-xs">
              <p className="text-neutral-500">
                {tForm("paidAmount")}: <span className="font-semibold text-emerald-700">{formatMoney(invoice.paidAmount, { currency })}</span>
              </p>
              <p className="text-amber-800 font-bold">
                {tForm("remainingAmount")}: {formatMoney(invoice.remainingAmount, { currency })}
              </p>
            </div>
          )}
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-100">
          <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
            {invoice.status !== "cancelled" && invoice.financialStatus !== "paid" && (
              <button
                type="button"
                onClick={() => setIsPaymentOpen(true)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#065F46] px-3.5 py-2 text-center text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-[#054E3B] active:scale-95"
              >
                <span>💳</span>
                <span>{tForm("recordPayment")}</span>
              </button>
            )}
            {invoice.status !== "cancelled" && (
              <button
                type="button"
                onClick={() => setIsShareOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-center text-xs sm:text-sm font-medium text-sky-800 transition hover:bg-sky-100 active:scale-95"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>{tForm("shareInvoice")}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {invoice.paidAmount > 0 && (
              <button
                type="button"
                onClick={() => setIsHistoryOpen(true)}
                title={tForm("paymentHistory")}
                className="rounded-xl border border-neutral-200 bg-white px-2.5 py-2 text-center text-xs font-medium text-neutral-700 hover:bg-neutral-50 active:scale-95 transition"
              >
                📜
              </button>
            )}
            <Link
              href={`/print/invoice/${invoice._id}?format=a4`}
              target="_blank"
              title="A4 Print"
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-center text-xs font-semibold text-emerald-800 hover:bg-emerald-100 active:scale-95 transition"
            >
              A4
            </Link>
            <Link
              href={`/print/invoice/${invoice._id}?format=pos`}
              target="_blank"
              title="POS Receipt"
              className="rounded-xl border border-neutral-200 bg-white px-2.5 py-2 text-center text-xs font-semibold text-neutral-700 hover:bg-neutral-50 active:scale-95 transition"
            >
              POS
            </Link>
          </div>
        </div>
      </li>

      {isPaymentOpen && (
        <RecordPaymentDialog
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          invoice={invoice}
          accounts={accounts}
          workspaceId={workspaceId}
          currency={currency}
        />
      )}

      {isHistoryOpen && (
        <InvoicePaymentsHistoryDialog
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          invoice={invoice}
          workspaceId={workspaceId}
          currency={currency}
        />
      )}

      {isShareOpen && (
        <InvoiceShareDialog
          onClose={() => setIsShareOpen(false)}
          invoice={invoice}
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          currency={currency}
          canUseWhatsApp={canUseWhatsApp}
        />
      )}
    </>
  );
}
