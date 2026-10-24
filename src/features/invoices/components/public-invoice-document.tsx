"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/money";
import type { PublicInvoiceView } from "@/features/invoices/types";

function formatDate(isoDate: string | null, lang: "ar" | "en") {
  if (!isoDate) return "—";
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG-u-nu-latn" : "en-US", {
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
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const currency = invoice.currency;

  const isPaid = invoice.financialStatus === "paid" || invoice.financialStatus === "legacy_paid";
  const isPartiallyPaid = invoice.financialStatus === "partially_paid";

  const isEn = lang === "en";

  const statusLabel = isPaid
    ? (isEn ? "Paid in Full" : "مدفوعة بالكامل")
    : isPartiallyPaid
      ? (isEn ? "Partially Paid" : "مدفوعة جزئياً")
      : (isEn ? "Unpaid / Pending" : "غير مدفوعة");

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-8" dir={isEn ? "ltr" : "rtl"}>
      {/* Top Action Bar (hidden when printing) */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm print:hidden">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-neutral-800">
            {isEn ? "Invoice" : "فاتورة"} {invoice.invoiceNumber}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
              isPaid
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : isPartiallyPaid
                  ? "bg-sky-50 text-sky-800 border-sky-200"
                  : "bg-amber-50 text-amber-800 border-amber-200"
            }`}
          >
            {statusLabel}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Language Switcher */}
          <div className="inline-flex items-center rounded-xl border border-neutral-200 bg-neutral-50 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setLang("ar")}
              className={`rounded-lg px-2.5 py-1 transition ${
                !isEn ? "bg-white text-neutral-900 shadow-2xs font-bold" : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              عربي
            </button>
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`rounded-lg px-2.5 py-1 transition ${
                isEn ? "bg-white text-neutral-900 shadow-2xs font-bold" : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              English
            </button>
          </div>

          {/* Print Button */}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 active:scale-95"
          >
            <span>🖨️</span>
            <span>{isEn ? "Print / Save PDF" : "طباعة / حفظ PDF"}</span>
          </button>
        </div>
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
                ? (isEn ? "Invoice is fully settled. Thank you!" : "تم سداد هذه الفاتورة بالكامل. شكراً لكم!")
                : isPartiallyPaid
                  ? (isEn ? "Invoice is partially paid" : "تم سداد جزء من الفاتورة ومتبقي دفعة")
                  : (isEn ? "Payment is due" : "هذه الفاتورة مستحقة السداد")}
            </p>
            {invoice.dueDate && !isPaid && (
              <p className="mt-0.5 text-xs opacity-80">
                {isEn ? "Due Date:" : "تاريخ الاستحقاق:"} {formatDate(invoice.dueDate, lang)}
              </p>
            )}
          </div>
          <div className="text-start font-bold text-lg font-mono">
            {isPaid ? (
              <span className="text-emerald-700">0.00 {currency}</span>
            ) : (
              <span>{formatMoney(invoice.remainingAmount, { currency, locale: isEn ? "en" : "ar" })}</span>
            )}
          </div>
        </div>
      </div>

      {/* A4 Sheet */}
      <article className="invoice-sheet invoice-sheet-a4 rounded-2xl border border-neutral-200 bg-white p-6 sm:p-10 shadow-sm text-neutral-900">
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
                {isEn ? "Tax Registration No:" : "الرقم الضريبي:"}{" "}
                <span className="font-mono font-semibold">{invoice.taxId}</span>
              </p>
            )}
            {(invoice.businessPhone || invoice.businessAddress) && (
              <p className="mt-1 text-xs text-neutral-500" dir="ltr">
                {[invoice.businessPhone, invoice.businessAddress].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>

          <div className="min-w-[220px] rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-xs sm:text-sm">
            <h2 className="font-bold text-emerald-800 text-sm sm:text-base">
              {isEn ? "TAX INVOICE / CLAIM" : "فاتورة ضريبية / مطالبة"}
            </h2>
            <p className="mt-2 text-neutral-600">
              <span className="text-neutral-500">{isEn ? "Invoice No:" : "رقم الفاتورة:"}</span>{" "}
              <span className="font-bold text-neutral-900 font-mono">{invoice.invoiceNumber}</span>
            </p>
            <p className="mt-1 text-neutral-600">
              <span className="text-neutral-500">{isEn ? "Issue Date:" : "تاريخ الإصدار:"}</span>{" "}
              <span className="text-neutral-900 font-medium">{formatDate(invoice.issueDate, lang)}</span>
            </p>
            {invoice.dueDate && (
              <p className="mt-1 text-neutral-600">
                <span className="text-neutral-500">{isEn ? "Due Date:" : "الاستحقاق:"}</span>{" "}
                <span className="font-semibold text-neutral-900">{formatDate(invoice.dueDate, lang)}</span>
              </p>
            )}
          </div>
        </header>

        {/* Client Details */}
        <section className="my-6 rounded-xl border border-neutral-100 bg-neutral-50/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            {isEn ? "Billed To (Client)" : "فاتورة إلى (العميل)"}
          </p>
          <p className="mt-1 font-bold text-neutral-900 text-base">{invoice.client.name}</p>
          {(invoice.client.phone || invoice.client.email) && (
            <p className="mt-0.5 text-xs text-neutral-500" dir="ltr">
              {[invoice.client.phone, invoice.client.email].filter(Boolean).join(" · ")}
            </p>
          )}
          {invoice.projectName && (
            <p className="mt-1.5 text-xs text-neutral-600">
              <span className="text-neutral-500">{isEn ? "Project:" : "المشروع:"}</span>{" "}
              <span className="font-semibold text-neutral-800">{invoice.projectName}</span>
            </p>
          )}
        </section>

        {/* Items Table */}
        <section className="mt-6">
          <table className="w-full border-collapse text-start text-xs sm:text-sm">
            <thead>
              <tr className="border-b-2 border-neutral-800 bg-neutral-100 text-neutral-700 text-xs font-semibold">
                <th className="px-3 py-3 w-12 text-center">#</th>
                <th className="px-3 py-3 text-start">{isEn ? "Description / Item" : "الوصف / البند"}</th>
                <th className="px-3 py-3 text-end">{isEn ? "Amount" : "المبلغ"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-neutral-50/50">
                  <td className="px-3 py-3 text-center text-xs text-neutral-400 font-mono">{idx + 1}</td>
                  <td className="px-3 py-3 font-medium text-neutral-900">{item.description}</td>
                  <td className="px-3 py-3 text-end font-semibold text-neutral-900 font-mono">
                    {formatMoney(item.amount, { currency, locale: isEn ? "en" : "ar" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Totals & Settlement Summary */}
        <section className="mt-6 border-t-2 border-neutral-800 pt-4">
          <div className="flex flex-col items-end gap-1.5 text-xs sm:text-sm">
            <div className="flex w-64 justify-between text-neutral-600">
              <span>{isEn ? "Total:" : "الإجمالي:"}</span>
              <span className="font-semibold text-neutral-900 font-mono">
                {formatMoney(invoice.total, { currency, locale: isEn ? "en" : "ar" })}
              </span>
            </div>

            {invoice.paidAmount > 0 && (
              <div className="flex w-64 justify-between text-emerald-700">
                <span>{isEn ? "Paid Amount:" : "المبلغ المدفوع:"}</span>
                <span className="font-semibold font-mono">
                  {formatMoney(invoice.paidAmount, { currency, locale: isEn ? "en" : "ar" })}
                </span>
              </div>
            )}

            <div className="mt-1 flex w-64 justify-between border-t border-neutral-200 pt-1.5 text-sm sm:text-base font-bold text-neutral-900">
              <span>{isEn ? "Remaining Amount:" : "المتبقي للاستحقاق:"}</span>
              <span
                className={`font-mono ${
                  invoice.remainingAmount > 0 ? "text-amber-800" : "text-emerald-700"
                }`}
              >
                {formatMoney(invoice.remainingAmount, { currency, locale: isEn ? "en" : "ar" })}
              </span>
            </div>
          </div>
        </section>

        {/* Notes & Payment Terms */}
        {invoice.notes && (
          <section className="mt-8 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-xs text-neutral-600">
            <p className="font-semibold text-neutral-800 mb-1">{isEn ? "Notes & Payment Terms:" : "ملاحظات وشروط الدفع:"}</p>
            <p className="whitespace-pre-line">{invoice.notes}</p>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-12 border-t border-dashed border-neutral-300 pt-4 text-center text-xs text-neutral-400">
          <p>{isEn ? "Thank you for your business!" : "شكراً لتعاملكم معنا ونتطلع لخدمتكم دائماً"}</p>
          <p className="mt-1 text-[11px] text-neutral-400">
            {isEn ? "Issued securely via" : "تم إصدار هذه المطالبة بأمان عبر"} · sanadat.site
          </p>
        </footer>
      </article>
    </div>
  );
}
