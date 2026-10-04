"use client";

import { formatMoney } from "@/lib/money";
import type { PublicInvoiceView } from "@/features/invoices/types";
import { useTranslations } from "next-intl";

function formatDate(isoDate: string | null) {
  if (!isoDate) return "—";
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(isoDate));
}

export function PublicInvoiceDocument({
  invoice,
}: {
  invoice: PublicInvoiceView;
}) {
  const t = useTranslations("forms.invoice");
  const currency = invoice.currency;

  const isPaid = invoice.financialStatus === "paid" || invoice.financialStatus === "legacy_paid";
  const isPartiallyPaid = invoice.financialStatus === "partially_paid";

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-8">
      {/* Top Action Bar (hidden when printing) */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm print:hidden">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-neutral-800">
            {t("publicViewTitle")} {invoice.invoiceNumber}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${
              isPaid
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : isPartiallyPaid
                ? "bg-sky-50 text-sky-800 border-sky-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}
          >
            {t(`financialStatuses.${invoice.financialStatus}`)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-emerald-700 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-800"
        >
          🖨️ {t("publicPrintButton")}
        </button>
      </div>

      {/* Payment Status Banner */}
      <div
        className={`mb-6 rounded-2xl p-4 text-sm font-medium border print:hidden ${
          isPaid
            ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
            : isPartiallyPaid
            ? "border-sky-200 bg-sky-50/70 text-sky-900"
            : "border-amber-200 bg-amber-50/70 text-amber-900"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-bold">
              {isPaid
                ? t("publicPaidInFull")
                : isPartiallyPaid
                ? t("publicPartiallyPaid")
                : t("publicPaymentDue")}
            </p>
            {invoice.dueDate && !isPaid && (
              <p className="mt-0.5 text-xs opacity-80">
                تاريخ الاستحقاق: {formatDate(invoice.dueDate)}
              </p>
            )}
          </div>
          <div className="text-left font-bold text-lg">
            {isPaid ? (
              <span className="text-emerald-700">✓ 0.00 {currency}</span>
            ) : (
              <span>{formatMoney(invoice.remainingAmount, { currency })}</span>
            )}
          </div>
        </div>
      </div>

      {/* A4 Sheet */}
      <article className="invoice-sheet invoice-sheet-a4 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm text-neutral-900">
        {/* Header */}
        <header className="flex flex-col justify-between gap-6 border-b-2 border-neutral-800 pb-6 sm:flex-row sm:items-start">
          <div>
            {invoice.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={invoice.logoUrl}
                alt=""
                className="mb-3 h-14 w-auto object-contain"
              />
            ) : null}
            <h1 className="text-2xl font-bold text-neutral-900">{invoice.businessName}</h1>
            {invoice.taxId && (
              <p className="mt-1 text-xs text-neutral-600">
                الرقم الضريبي: {invoice.taxId}
              </p>
            )}
            {(invoice.businessPhone || invoice.businessAddress) && (
              <p className="mt-1 text-xs text-neutral-500" dir="ltr">
                {[invoice.businessPhone, invoice.businessAddress].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>

          <div className="min-w-[220px] rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm">
            <h2 className="font-bold text-emerald-800 text-base">فاتورة ضريبية / مطالبة</h2>
            <p className="mt-2 text-neutral-600">
              <span className="text-neutral-500">رقم الفاتورة:</span>{" "}
              <span className="font-semibold text-neutral-900">{invoice.invoiceNumber}</span>
            </p>
            <p className="text-neutral-600">
              <span className="text-neutral-500">تاريخ الإصدار:</span>{" "}
              <span className="text-neutral-900">{formatDate(invoice.issueDate)}</span>
            </p>
            {invoice.dueDate && (
              <p className="text-neutral-600">
                <span className="text-neutral-500">الاستحقاق:</span>{" "}
                <span className="font-semibold text-neutral-900">{formatDate(invoice.dueDate)}</span>
              </p>
            )}
          </div>
        </header>

        {/* Client Details */}
        <section className="my-6 rounded-xl border border-neutral-100 bg-neutral-50/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            فاتورة إلى (العميل)
          </p>
          <p className="mt-1 font-bold text-neutral-900">{invoice.client.name}</p>
          {(invoice.client.phone || invoice.client.email) && (
            <p className="mt-0.5 text-xs text-neutral-500" dir="ltr">
              {[invoice.client.phone, invoice.client.email].filter(Boolean).join(" · ")}
            </p>
          )}
          {invoice.projectName && (
            <p className="mt-1 text-xs text-neutral-600">
              <span className="text-neutral-500">المشروع:</span> {invoice.projectName}
            </p>
          )}
        </section>

        {/* Items Table */}
        <section className="mt-6">
          <table className="w-full border-collapse text-right text-sm">
            <thead>
              <tr className="border-b-2 border-neutral-800 bg-neutral-100 text-neutral-700 text-xs font-semibold">
                <th className="px-3 py-3 w-12 text-center">#</th>
                <th className="px-3 py-3">الوصف / البند</th>
                <th className="px-3 py-3 text-left">المبلغ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-neutral-50/50">
                  <td className="px-3 py-3 text-center text-xs text-neutral-400">{idx + 1}</td>
                  <td className="px-3 py-3 font-medium text-neutral-900">{item.description}</td>
                  <td className="px-3 py-3 text-left font-semibold text-neutral-900">
                    {formatMoney(item.amount, { currency })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Totals & Settlement Summary */}
        <section className="mt-6 border-t-2 border-neutral-800 pt-4">
          <div className="flex flex-col items-end gap-1.5 text-sm">
            <div className="flex w-64 justify-between text-neutral-600">
              <span>{t("total")}:</span>
              <span className="font-semibold text-neutral-900">
                {formatMoney(invoice.total, { currency })}
              </span>
            </div>

            {invoice.paidAmount > 0 && (
              <div className="flex w-64 justify-between text-emerald-700">
                <span>{t("paidAmount")}:</span>
                <span className="font-semibold">
                  {formatMoney(invoice.paidAmount, { currency })}
                </span>
              </div>
            )}

            <div className="mt-1 flex w-64 justify-between border-t border-neutral-200 pt-1.5 text-base font-bold text-neutral-900">
              <span>{t("remainingAmount")}:</span>
              <span className={invoice.remainingAmount > 0 ? "text-amber-800" : "text-emerald-700"}>
                {formatMoney(invoice.remainingAmount, { currency })}
              </span>
            </div>
          </div>
        </section>

        {/* Notes & Payment Terms */}
        {invoice.notes && (
          <section className="mt-8 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-xs text-neutral-600">
            <p className="font-semibold text-neutral-800 mb-1">{t("notes")}:</p>
            <p className="whitespace-pre-line">{invoice.notes}</p>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-12 border-t border-dashed border-neutral-300 pt-4 text-center text-xs text-neutral-400">
          <p>{t("thanks")}</p>
          <p className="mt-1 text-[11px] text-neutral-400">
            {t("publicPoweredBy")} · sanadat.site
          </p>
        </footer>
      </article>
    </div>
  );
}
