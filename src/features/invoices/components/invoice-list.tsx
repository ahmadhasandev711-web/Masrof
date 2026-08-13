"use client";

import { useTransition } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import type { InvoiceListItem } from "@/features/invoices/types";
import type { InvoiceDisplayStatus } from "@/features/invoices/status";
import { updateInvoiceStatusAction } from "@/features/invoices/actions/update-status";
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

export function InvoiceList({
  invoices,
  currency,
  workspaceId,
}: {
  invoices: InvoiceListItem[];
  currency: string;
  workspaceId: string;
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
  tStatus,
  tForm,
}: {
  invoice: InvoiceListItem;
  currency: string;
  workspaceId: string;
  tStatus: ReturnType<typeof useTranslations>;
  tForm: ReturnType<typeof useTranslations>;
}) {
  const [isPending, startTransition] = useTransition();

  function setStatus(status: "sent" | "paid" | "draft") {
    startTransition(() => {
      void updateInvoiceStatusAction(invoice._id, workspaceId, status);
    });
  }

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-neutral-900">{invoice.invoiceNumber}</p>
          <span
            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass(invoice.displayStatus)}`}
          >
            {tStatus(invoice.displayStatus)}
          </span>
        </div>
        <p className="text-sm text-neutral-500">
          {invoice.clientName} · {formatDate(invoice.issueDate)}
          {invoice.dueDate ? ` · ${tForm("dueDate")}: ${formatDate(invoice.dueDate)}` : ""}
        </p>
        <p className="mt-1 text-sm font-semibold text-emerald-800">
          {formatMoney(invoice.total, { currency })}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap gap-1.5 sm:flex-col sm:items-stretch">
        {invoice.status !== "paid" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => setStatus("paid")}
            className="rounded-lg bg-emerald-700 px-3 py-1.5 text-center text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {tStatus("markPaid")}
          </button>
        )}
        {invoice.status === "draft" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => setStatus("sent")}
            className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-center text-sm font-medium text-sky-800 hover:bg-sky-100 disabled:opacity-60"
          >
            {tStatus("markSent")}
          </button>
        )}
        {invoice.status === "paid" && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => setStatus("sent")}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-center text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
          >
            {tStatus("markUnpaid")}
          </button>
        )}
        <Link
          href={`/print/invoice/${invoice._id}?format=a4`}
          target="_blank"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-center text-sm font-medium text-emerald-800 hover:bg-emerald-100"
        >
          A4
        </Link>
        <Link
          href={`/print/invoice/${invoice._id}?format=pos`}
          target="_blank"
          className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-center text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          POS
        </Link>
      </div>
    </li>
  );
}
