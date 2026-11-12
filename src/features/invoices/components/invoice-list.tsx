"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import type { InvoiceListItem, InvoiceFinancialStatus } from "@/features/invoices/types";
import type { InvoiceDisplayStatus } from "@/features/invoices/status";
import { RecordPaymentDialog } from "@/features/invoices/components/record-payment-dialog";
import { InvoicePaymentsHistoryDialog } from "@/features/invoices/components/invoice-payments-history-dialog";
import { InvoiceShareDialog } from "@/features/invoices/components/invoice-share-dialog";
import { EditInvoiceDialog } from "@/features/invoices/components/edit-invoice-dialog";
import { cancelInvoiceAction } from "@/features/invoices/actions/cancel-invoice";
import { archiveInvoiceAction } from "@/features/invoices/actions/archive-invoice";
import type { ComboboxClientItem } from "@/features/clients/components/client-combobox";
import { useTranslations, useLocale } from "next-intl";
import { NavIcon } from "@/components/ui/app-icons";

function formatDate(isoDate: string, locale = "ar") {
  const targetLocale = locale.startsWith("en") ? "en-US" : "ar-EG-u-nu-latn";
  return new Intl.DateTimeFormat(targetLocale, {
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

type ProjectOption = { _id: string; name: string; clientId: string };

export function InvoiceList({
  invoices,
  currency,
  workspaceId,
  workspaceName = "",
  canUseWhatsApp = false,
  accounts = [],
  clients = [],
  projects = [],
  canWrite = true,
}: {
  invoices: InvoiceListItem[];
  currency: string;
  workspaceId: string;
  workspaceName?: string;
  canUseWhatsApp?: boolean;
  accounts?: { _id: string; name: string; currency?: string | null }[];
  clients?: ComboboxClientItem[];
  projects?: ProjectOption[];
  canWrite?: boolean;
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
          clients={clients}
          projects={projects}
          canWrite={canWrite}
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
  clients,
  projects,
  canWrite,
  tStatus,
  tForm,
}: {
  invoice: InvoiceListItem;
  currency: string;
  workspaceId: string;
  workspaceName: string;
  canUseWhatsApp: boolean;
  accounts: { _id: string; name: string; currency?: string | null }[];
  clients: ComboboxClientItem[];
  projects: ProjectOption[];
  canWrite: boolean;
  tStatus: ReturnType<typeof useTranslations>;
  tForm: ReturnType<typeof useTranslations>;
}) {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const locale = useLocale();
  const tPages = useTranslations("pages.invoices");
  const tCommon = useTranslations("common");

  const [isCancelling, startCancelTransition] = useTransition();
  const [isArchiving, startArchiveTransition] = useTransition();
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  return (
    <>
      <li className="flex flex-col gap-3.5 rounded-2xl border border-neutral-200/90 bg-white p-4 sm:p-5 shadow-xs transition hover:shadow-sm">
        {/* Top Header: Invoice # & Single Smart Status Badge */}
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
                <span>👁</span>
                <span>{tForm("viewedBadge")}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {invoice.status === "cancelled" ? (
              <span className="rounded-full border border-neutral-200 bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-500 line-through">
                {tStatus("cancelled")}
              </span>
            ) : invoice.financialStatus === "paid" ? (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                {tForm("financialStatuses.paid")}
              </span>
            ) : invoice.financialStatus === "partially_paid" ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                {tForm("financialStatuses.partially_paid")}
              </span>
            ) : invoice.displayStatus === "overdue" ? (
              <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
                {tStatus("overdue")}
              </span>
            ) : invoice.displayStatus === "draft" ? (
              <span className="rounded-full border border-neutral-200 bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-600">
                {tStatus("draft")}
              </span>
            ) : (
              <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-800">
                {tStatus("sent")}
              </span>
            )}
          </div>
        </div>

        {/* Client & Date Details */}
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-neutral-400 text-xs">👤</span>
            <p className="font-bold text-neutral-900 text-sm sm:text-base">
              {invoice.clientName}
            </p>
            {invoice.projectName && (
              <span className="font-medium text-xs text-purple-700 bg-purple-50 border border-purple-200/60 px-2 py-0.5 rounded-md">
                📁 {invoice.projectName}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
            <span>📅 {formatDate(invoice.issueDate, locale)}</span>
            {invoice.dueDate && (
              <span className={`font-medium ${invoice.displayStatus === "overdue" ? "text-rose-700 font-bold" : "text-neutral-600"}`}>
                ⏳ {tForm("dueDate")}: {formatDate(invoice.dueDate, locale)}
              </span>
            )}
          </div>
        </div>

        {/* Financial Amount Box */}
        <div className="rounded-xl bg-[#FBF9F4] p-3 border border-[#E4DFD3]/70 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] text-neutral-500 font-medium">{tForm("total")}</p>
            <p className="font-mono text-base sm:text-lg font-bold tabular-nums text-neutral-900">
              {formatMoney(invoice.total, { currency, locale })}
            </p>
          </div>
          {invoice.financialStatus === "partially_paid" ? (
            <div className="text-left rtl:text-right text-xs">
              <p className="text-neutral-500">
                {tForm("paidAmount")}: <span className="font-mono font-bold tabular-nums text-emerald-700">{formatMoney(invoice.paidAmount, { currency, locale })}</span>
              </p>
              <p className="text-amber-800 font-bold">
                {tForm("remainingAmount")}: <span className="font-mono font-bold tabular-nums">{formatMoney(invoice.remainingAmount, { currency, locale })}</span>
              </p>
            </div>
          ) : invoice.financialStatus === "paid" ? (
            <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <span>✓</span>
              <span>{tForm("financialStatuses.paid")}</span>
            </div>
          ) : null}
        </div>

        {/* Action Error Message */}
        {actionError && (
          <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
            <span>⚠️ {actionError}</span>
            <button
              type="button"
              onClick={() => setActionError(null)}
              className="px-1 font-bold text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        {/* Cancel Confirmation Banner */}
        {cancelConfirm && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <span>
              {tPages("cancelConfirmQuestion", { number: invoice.invoiceNumber })}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isCancelling}
                onClick={() => {
                  startCancelTransition(async () => {
                    const res = await cancelInvoiceAction(invoice._id, workspaceId);
                    if (res?.error) {
                      setActionError(res.error);
                    } else {
                      setCancelConfirm(false);
                    }
                  });
                }}
                className="rounded-lg bg-amber-700 px-3 py-1 font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
              >
                {isCancelling ? tPages("cancelling") : tPages("confirmCancel")}
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={() => setCancelConfirm(false)}
                className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1 font-medium text-neutral-700 hover:bg-neutral-50"
              >
                {tPages("back")}
              </button>
            </div>
          </div>
        )}

        {/* Archive / Delete Confirmation Banner */}
        {archiveConfirm && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-900">
            <span>
              {tPages("deleteConfirmQuestion", { number: invoice.invoiceNumber })}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isArchiving}
                onClick={() => {
                  startArchiveTransition(async () => {
                    const res = await archiveInvoiceAction(invoice._id, workspaceId);
                    if (res?.error) {
                      setActionError(res.error);
                    } else {
                      setArchiveConfirm(false);
                    }
                  });
                }}
                className="rounded-lg bg-red-700 px-3 py-1 font-semibold text-white hover:bg-red-800 disabled:opacity-50"
              >
                {isArchiving ? tPages("deleting") : tPages("confirmDelete")}
              </button>
              <button
                type="button"
                disabled={isArchiving}
                onClick={() => setArchiveConfirm(false)}
                className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1 font-medium text-neutral-700 hover:bg-neutral-50"
              >
                {tPages("back")}
              </button>
            </div>
          </div>
        )}

        {/* Action Toolbar */}
        <div className="flex flex-col gap-3 border-t border-neutral-100 pt-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          {/* Primary Actions (Record payment & Share) */}
          <div className="flex flex-wrap items-center gap-2">
            {invoice.status !== "cancelled" && invoice.financialStatus !== "paid" && (
              <button
                type="button"
                onClick={() => setIsPaymentOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#065F46] px-3.5 py-2 text-center text-xs sm:text-sm font-bold text-white shadow-xs transition hover:bg-[#054E3B] active:scale-95"
              >
                <span>💳</span>
                <span>{tForm("recordPayment")}</span>
              </button>
            )}

            {invoice.status !== "cancelled" && (
              <button
                type="button"
                onClick={() => setIsShareOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-center text-xs sm:text-sm font-semibold text-sky-800 transition hover:bg-sky-100 active:scale-95"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>{tForm("shareInvoice")}</span>
              </button>
            )}
          </div>

          {/* Secondary: print + manage */}
          <div className="flex flex-col gap-2 sm:ms-auto sm:items-end">
            <div className="inline-flex w-full items-center rounded-xl border border-neutral-200 bg-neutral-50 p-0.5 text-xs font-semibold sm:w-auto">
              <Link
                href={`/print/invoice/${invoice._id}?format=a4`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg px-3 py-2 text-neutral-800 transition hover:bg-white hover:shadow-2xs sm:flex-none sm:px-4"
              >
                A4
              </Link>
              <span className="text-neutral-300" aria-hidden>
                |
              </span>
              <Link
                href={`/print/invoice/${invoice._id}?format=pos`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg px-3 py-2 text-neutral-800 transition hover:bg-white hover:shadow-2xs sm:flex-none sm:px-4"
              >
                {tForm("printThermal80")}
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {invoice.paidAmount > 0 && (
                <button
                  type="button"
                  onClick={() => setIsHistoryOpen(true)}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
                >
                  <NavIcon name="inbox" className="h-4 w-4 shrink-0" />
                  <span>{tForm("paymentHistory")}</span>
                </button>
              )}

              {canWrite && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(true)}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
                  >
                    <NavIcon name="edit" className="h-4 w-4 shrink-0" />
                    <span>{tPages("edit")}</span>
                  </button>

                  {invoice.status !== "cancelled" && (
                    <button
                      type="button"
                      onClick={() => {
                        if (invoice.paidAmount > 0) {
                          setActionError(tPages("cannotCancelPaidError"));
                        } else {
                          setCancelConfirm(true);
                        }
                      }}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 transition hover:bg-amber-100"
                    >
                      <NavIcon name="ban" className="h-4 w-4 shrink-0" />
                      <span>{tPages("cancel")}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (invoice.paidAmount > 0) {
                        setActionError(tPages("cannotDeletePaidError"));
                      } else {
                        setArchiveConfirm(true);
                      }
                    }}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-800 transition hover:bg-rose-100"
                  >
                    <NavIcon name="trash" className="h-4 w-4 shrink-0" />
                    <span>{tCommon("delete")}</span>
                  </button>
                </>
              )}
            </div>
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

      {isEditOpen && (
        <EditInvoiceDialog
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          invoice={invoice}
          workspaceId={workspaceId}
          clients={clients}
          projects={projects}
          currency={currency}
        />
      )}
    </>
  );
}
