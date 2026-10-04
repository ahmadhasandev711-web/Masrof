"use client";

import Link from "next/link";
import { formatMoney } from "@/lib/money";
import type { ClientStatementView } from "@/features/clients/statement-data";
import { useTranslations } from "next-intl";

function formatDate(isoDate: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(isoDate));
}

export function ClientStatementDocument({
  statement,
  returnHref = "/dashboard/clients",
}: {
  statement: ClientStatementView;
  returnHref?: string;
}) {
  const t = useTranslations("forms.invoice");
  const tCommon = useTranslations("common");
  const currency = statement.branding.currency;

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-8">
      {/* Print / Action Toolbar (hidden when printed) */}
      <div className="mb-6 flex items-center justify-between gap-3 print:hidden">
        <Link
          href={returnHref}
          className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50"
        >
          {tCommon("back")}
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-emerald-700 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-800"
        >
          {t("printStatement") || "طباعة كشف الحساب / PDF"}
        </button>
      </div>

      {/* A4 Sheet */}
      <article className="invoice-sheet invoice-sheet-a4 rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm text-neutral-900">
        {/* Header */}
        <header className="flex flex-col justify-between gap-6 border-b-2 border-neutral-800 pb-6 sm:flex-row sm:items-start">
          <div>
            {statement.branding.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={statement.branding.logoUrl}
                alt=""
                className="mb-3 h-14 w-auto object-contain"
              />
            ) : null}
            <h1 className="text-2xl font-bold text-neutral-900">
              {statement.branding.businessName}
            </h1>
            {statement.branding.taxId && (
              <p className="mt-1 text-xs text-neutral-600">
                الرقم الضريبي: {statement.branding.taxId}
              </p>
            )}
            {(statement.branding.businessPhone || statement.branding.businessAddress) && (
              <p className="mt-1 text-xs text-neutral-500" dir="ltr">
                {[statement.branding.businessPhone, statement.branding.businessAddress]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </div>

          <div className="min-w-[240px] rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm">
            <h2 className="font-bold text-emerald-800 text-base">
              {t("clientStatement") || "كشف حساب عميل"}
            </h2>
            <p className="mt-2 text-neutral-600">
              <span className="text-neutral-500">العميل:</span>{" "}
              <span className="font-semibold text-neutral-900">{statement.client.name}</span>
            </p>
            {(statement.client.phone || statement.client.email) && (
              <p className="mt-1 text-xs text-neutral-500" dir="ltr">
                {[statement.client.phone, statement.client.email].filter(Boolean).join(" · ")}
              </p>
            )}
            <p className="mt-2 text-xs text-neutral-400">
              {t("statementDate") || "تاريخ الكشف"}: {formatDate(statement.generatedAt)}
            </p>
          </div>
        </header>

        {/* Financial Summary Cards */}
        <section className="my-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 text-center">
            <p className="text-xs text-neutral-500">{t("totalInvoiced") || "إجمالي المطالبات"}</p>
            <p className="mt-1 text-lg font-bold text-neutral-900">
              {formatMoney(statement.totalInvoiced, { currency })}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-center">
            <p className="text-xs text-emerald-800">{t("totalPaid") || "إجمالي السداد"}</p>
            <p className="mt-1 text-lg font-bold text-emerald-700">
              {formatMoney(statement.totalPaid, { currency })}
            </p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-center">
            <p className="text-xs text-amber-800">
              {t("currentOutstanding") || "الرصيد المستحق (المديونية)"}
            </p>
            <p className="mt-1 text-lg font-bold text-amber-900">
              {formatMoney(statement.currentOutstanding, { currency })}
            </p>
          </div>
        </section>

        {/* Statement Chronological Ledger Table */}
        <section className="mt-6">
          <table className="w-full border-collapse text-right text-sm">
            <thead>
              <tr className="border-b-2 border-neutral-800 bg-neutral-100 text-neutral-700 text-xs font-semibold">
                <th className="px-3 py-3">التاريخ</th>
                <th className="px-3 py-3">البيان</th>
                <th className="px-3 py-3">المرجع / الفاتورة</th>
                <th className="px-3 py-3">المشروع</th>
                <th className="px-3 py-3 text-left">مطالبة (+)</th>
                <th className="px-3 py-3 text-left">سداد (-)</th>
                <th className="px-3 py-3 text-left">الرصيد المستمر</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {statement.entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-neutral-400">
                    {t("noStatementEntries") || "لا توجد فواتير أو حركات مسجلة لهذا العميل حتى الآن."}
                  </td>
                </tr>
              ) : (
                statement.entries.map((entry) => {
                  const isInvoice = entry.type === "invoice";
                  return (
                    <tr key={entry.id} className="hover:bg-neutral-50/50">
                      <td className="px-3 py-3 text-xs text-neutral-600">
                        {formatDate(entry.date)}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            isInvoice
                              ? "bg-sky-50 text-sky-800 border border-sky-200"
                              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {isInvoice ? "فاتورة" : "دفعة / سداد"}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-medium text-neutral-900">
                        {entry.numberOrRef}
                      </td>
                      <td className="px-3 py-3 text-xs text-neutral-500">
                        {entry.projectName || "—"}
                      </td>
                      <td className="px-3 py-3 text-left font-medium text-neutral-900">
                        {entry.debit > 0 ? formatMoney(entry.debit, { currency }) : "—"}
                      </td>
                      <td className="px-3 py-3 text-left font-medium text-emerald-700">
                        {entry.credit > 0 ? formatMoney(entry.credit, { currency }) : "—"}
                      </td>
                      <td className="px-3 py-3 text-left font-bold text-neutral-900">
                        {formatMoney(entry.runningBalance, { currency })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>

        {/* Footer */}
        <footer className="mt-12 border-t border-dashed border-neutral-300 pt-4 text-center text-xs text-neutral-400">
          <p>شكراً لتعاملكم معنا · كشف حساب إلكتروني معتمد</p>
        </footer>
      </article>
    </div>
  );
}
