import { formatMoney } from "@/lib/money";
import type { InvoicePrintView } from "@/features/invoices/types";
import type { InvoicePrintFormat } from "@/features/invoices/constants";
import { getTranslations } from "next-intl/server";

function formatDate(isoDate: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(isoDate));
}

export async function InvoicePrintDocument({
  invoice,
  format,
}: {
  invoice: InvoicePrintView;
  format: InvoicePrintFormat;
}) {
  const [tForm, tCommon, tDashboard] = await Promise.all([
    getTranslations("forms.invoice"),
    getTranslations("common"),
    getTranslations("dashboard.alerts"),
  ]);

  if (format === "pos") {
    return <InvoicePosLayout invoice={invoice} tForm={tForm} tCommon={tCommon} tDashboard={tDashboard} />;
  }

  return <InvoiceA4Layout invoice={invoice} tForm={tForm} tCommon={tCommon} tDashboard={tDashboard} />;
}

function InvoiceA4Layout({
  invoice,
  tForm,
  tCommon,
  tDashboard,
}: {
  invoice: InvoicePrintView;
  tForm: Awaited<ReturnType<typeof getTranslations>>;
  tCommon: Awaited<ReturnType<typeof getTranslations>>;
  tDashboard: Awaited<ReturnType<typeof getTranslations>>;
}) {
  return (
    <article className="invoice-sheet invoice-sheet-a4 text-neutral-900">
      <header className="flex items-start justify-between gap-8 border-b-2 border-neutral-800 pb-6">
        <div>
          <p className="text-xs font-semibold tracking-wide text-neutral-500">{tForm("title")}</p>
          <h1 className="mt-2 text-3xl font-bold text-neutral-900">{invoice.workspaceName}</h1>
        </div>
        <div className="min-w-[220px] rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm">
          <p className="font-bold text-emerald-800">{invoice.invoiceNumber}</p>
          <p className="mt-2 text-neutral-600">
            {tForm("issueDate")}: {formatDate(invoice.issueDate)}
          </p>
          {invoice.dueDate && (
            <p className="text-neutral-600">
              {tForm("dueDate")}: {formatDate(invoice.dueDate)}
            </p>
          )}
        </div>
      </header>

      <section className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 p-4">
          <p className="text-xs font-semibold uppercase text-neutral-500">{tForm("client")}</p>
          <p className="mt-2 text-xl font-semibold">{invoice.client.name}</p>
          {(invoice.client.email || invoice.client.phone) && (
            <p className="mt-2 text-sm text-neutral-600" dir="ltr">
              {[invoice.client.email, invoice.client.phone].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <div className="rounded-lg border border-neutral-200 p-4">
          <p className="text-xs font-semibold uppercase text-neutral-500">{tDashboard("from")}</p>
          <p className="mt-2 text-lg font-semibold">{invoice.workspaceName}</p>
          <p className="mt-2 text-sm text-neutral-600">{tCommon("appName")}</p>
        </div>
      </section>

      <section className="mt-10">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-neutral-800 bg-neutral-100 text-neutral-700">
              <th className="px-3 py-3 text-right font-semibold">#</th>
              <th className="px-3 py-3 text-right font-semibold">{tForm("itemDescription")}</th>
              <th className="px-3 py-3 text-left font-semibold">{tForm("itemAmount")}</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={`${item.description}-${index}`} className="border-b border-neutral-200">
                <td className="px-3 py-3 text-neutral-500">{index + 1}</td>
                <td className="px-3 py-3">{item.description}</td>
                <td className="px-3 py-3 text-left font-medium">
                  {formatMoney(item.amount, { currency: invoice.currency })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-6 flex justify-end">
        <div className="min-w-[280px] rounded-lg border-2 border-emerald-800 bg-emerald-50 px-6 py-4">
          <div className="flex items-center justify-between gap-8 text-lg font-bold">
            <span>Total</span>
            <span className="text-emerald-900">
              {formatMoney(invoice.total, { currency: invoice.currency })}
            </span>
          </div>
        </div>
      </section>

      {invoice.notes && (
        <section className="mt-8 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm">
          <p className="font-semibold text-neutral-900">{tForm("notes")}</p>
          <p className="mt-2 whitespace-pre-wrap leading-relaxed text-neutral-700">{invoice.notes}</p>
        </section>
      )}

      <footer className="mt-12 border-t border-neutral-200 pt-4 text-center text-xs text-neutral-400">
        {tCommon("appName")} · {formatDate(new Date().toISOString())}
      </footer>
    </article>
  );
}

function InvoicePosLayout({
  invoice,
  tForm,
  tCommon,
  tDashboard,
}: {
  invoice: InvoicePrintView;
  tForm: Awaited<ReturnType<typeof getTranslations>>;
  tCommon: Awaited<ReturnType<typeof getTranslations>>;
  tDashboard: Awaited<ReturnType<typeof getTranslations>>;
}) {
  return (
    <article className="invoice-sheet invoice-sheet-pos text-neutral-900">
      <header className="border-b border-dashed border-neutral-400 pb-3 text-center">
        <p className="text-[11px] text-neutral-500">{tForm("title")}</p>
        <h1 className="text-base font-bold">{invoice.workspaceName}</h1>
        <p className="mt-1 text-[11px] font-semibold text-emerald-800">{invoice.invoiceNumber}</p>
        <p className="mt-1 text-[10px] text-neutral-600">{formatDate(invoice.issueDate)}</p>
        {invoice.dueDate && (
          <p className="text-[10px] text-neutral-600">
            {tForm("dueDate")}: {formatDate(invoice.dueDate)}
          </p>
        )}
      </header>

      <section className="border-b border-dashed border-neutral-300 py-3 text-[11px]">
        <p className="text-neutral-500">{tForm("client")}</p>
        <p className="font-semibold">{invoice.client.name}</p>
        {(invoice.client.phone || invoice.client.email) && (
          <p className="mt-1 text-[10px] text-neutral-600" dir="ltr">
            {[invoice.client.phone, invoice.client.email].filter(Boolean).join(" · ")}
          </p>
        )}
      </section>

      <section className="py-2">
        {invoice.items.map((item, index) => (
          <div
            key={`${item.description}-${index}`}
            className="flex items-start justify-between gap-2 border-b border-dotted border-neutral-200 py-2 text-[11px]"
          >
            <span className="flex-1">{item.description}</span>
            <span className="shrink-0 font-medium">
              {formatMoney(item.amount, { currency: invoice.currency })}
            </span>
          </div>
        ))}
      </section>

      <section className="border-t-2 border-neutral-800 py-3">
        <div className="flex items-center justify-between text-sm font-bold">
          <span>Total</span>
          <span>{formatMoney(invoice.total, { currency: invoice.currency })}</span>
        </div>
      </section>

      {invoice.notes && (
        <section className="border-t border-dashed border-neutral-300 py-2 text-[10px] text-neutral-600">
          <p className="font-medium text-neutral-800">{tForm("notes")}</p>
          <p className="mt-1 whitespace-pre-wrap">{invoice.notes}</p>
        </section>
      )}

      <p className="mt-3 text-center text-[9px] text-neutral-400">{tCommon("appName")}</p>
    </article>
  );
}
