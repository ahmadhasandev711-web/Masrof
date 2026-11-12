import { formatMoney } from "@/lib/money";
import type { InvoicePrintView } from "@/features/invoices/types";
import type { InvoicePrintFormat } from "@/features/invoices/constants";
import { getTranslations } from "next-intl/server";

function formatDate(isoDate: string) {
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
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
  const [tForm, tCommon, tDashboard, tBrand] = await Promise.all([
    getTranslations("forms.invoice"),
    getTranslations("common"),
    getTranslations("dashboard.alerts"),
    getTranslations("forms.workspaceBranding"),
  ]);

  if (format === "pos") {
    return (
      <InvoicePosLayout
        invoice={invoice}
        tForm={tForm}
        tCommon={tCommon}
        tDashboard={tDashboard}
        tBrand={tBrand}
      />
    );
  }

  return (
    <InvoiceA4Layout
      invoice={invoice}
      tForm={tForm}
      tCommon={tCommon}
      tDashboard={tDashboard}
      tBrand={tBrand}
    />
  );
}

type TFn = Awaited<ReturnType<typeof getTranslations>>;

function BrandBlock({
  invoice,
  tBrand,
  compact = false,
}: {
  invoice: InvoicePrintView;
  tBrand: TFn;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "text-center" : ""}>
      {invoice.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={invoice.logoUrl}
          alt=""
          className={compact ? "mx-auto mb-2 h-10 w-auto object-contain" : "mb-3 h-14 w-auto object-contain"}
        />
      ) : null}
      <h1 className={compact ? "text-base font-bold" : "text-3xl font-bold text-neutral-900"}>
        {invoice.businessName}
      </h1>
      {invoice.taxId ? (
        <p className={compact ? "mt-0.5 text-[10px] text-neutral-600" : "mt-1 text-sm text-neutral-600"}>
          {tBrand("taxId")}: {invoice.taxId}
        </p>
      ) : null}
      {(invoice.businessPhone || invoice.businessAddress) && (
        <p
          className={compact ? "mt-0.5 text-[10px] text-neutral-500" : "mt-1 text-sm text-neutral-500"}
          dir="ltr"
        >
          {[invoice.businessPhone, invoice.businessAddress].filter(Boolean).join(" · ")}
        </p>
      )}
    </div>
  );
}

function financialStatusLabel(
  status: InvoicePrintView["financialStatus"],
  tForm: TFn,
): string {
  return tForm(`financialStatuses.${status}`);
}

function financialStatusBadgeClass(status: InvoicePrintView["financialStatus"]) {
  switch (status) {
    case "paid":
    case "legacy_paid":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "partially_paid":
      return "bg-sky-50 text-sky-800 border-sky-200";
    default:
      return "bg-amber-50 text-amber-800 border-amber-200";
  }
}

function InvoiceA4Layout({
  invoice,
  tForm,
  tCommon,
  tDashboard,
  tBrand,
}: {
  invoice: InvoicePrintView;
  tForm: TFn;
  tCommon: TFn;
  tDashboard: TFn;
  tBrand: TFn;
}) {
  return (
    <article className="invoice-sheet invoice-sheet-a4 text-neutral-900">
      <header className="flex flex-col justify-between gap-6 border-b-2 border-neutral-800 pb-6 sm:flex-row sm:items-start">
        <div>
          <BrandBlock invoice={invoice} tBrand={tBrand} />
        </div>
        <div className="min-w-[220px] shrink-0 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm">
          <h2 className="font-bold text-emerald-800">{tForm("printTaxInvoiceTitle")}</h2>
          <p className="mt-2 font-mono font-bold text-neutral-900">{invoice.invoiceNumber}</p>
          <span
            className={`mt-2 inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${financialStatusBadgeClass(invoice.financialStatus)}`}
          >
            {financialStatusLabel(invoice.financialStatus, tForm)}
          </span>
          {invoice.projectName && (
            <p className="mt-2 font-medium text-neutral-700">
              {tForm("project")}: {invoice.projectName}
            </p>
          )}
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

      <section className="mt-8 rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">{tForm("client")}</p>
        <p className="mt-2 text-xl font-semibold">{invoice.client.name}</p>
        {(invoice.client.email || invoice.client.phone) && (
          <p className="mt-2 text-sm text-neutral-600" dir="ltr">
            {[invoice.client.email, invoice.client.phone].filter(Boolean).join(" · ")}
          </p>
        )}
      </section>

      <section className="mt-10">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-neutral-800 bg-neutral-100 text-neutral-700">
              <th className="px-3 py-3 text-right font-semibold">#</th>
              <th className="px-3 py-3 text-right font-semibold">{tForm("itemDescription")}</th>
              <th className="px-3 py-3 text-left font-semibold">{tForm("itemQuantity")}</th>
              <th className="px-3 py-3 text-left font-semibold">{tForm("itemUnitPrice")}</th>
              <th className="px-3 py-3 text-left font-semibold">{tForm("itemAmount")}</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={`${item.description}-${index}`} className="border-b border-neutral-200">
                <td className="px-3 py-3 text-neutral-500">{index + 1}</td>
                <td className="px-3 py-3">{item.description}</td>
                <td className="px-3 py-3 text-left font-mono">{item.quantity}</td>
                <td className="px-3 py-3 text-left font-medium">
                  {formatMoney(item.unitPrice, { currency: invoice.currency })}
                </td>
                <td className="px-3 py-3 text-left font-medium">
                  {formatMoney(item.amount, { currency: invoice.currency })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-6 border-t-2 border-neutral-800 pt-4">
        <div className="ms-auto flex w-full max-w-xs flex-col gap-2 text-sm">
          {invoice.taxEnabled && (
            <>
              <div className="flex justify-between text-neutral-600">
                <span>{tForm("subtotal")}</span>
                <span className="font-mono">
                  {formatMoney(invoice.subtotal, { currency: invoice.currency })}
                </span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>
                  {tForm("taxAmount")} ({invoice.taxRatePercent}%)
                </span>
                <span className="font-mono">
                  {formatMoney(invoice.taxAmount, { currency: invoice.currency })}
                </span>
              </div>
            </>
          )}
          <div className="flex justify-between text-neutral-600">
            <span>{tForm("total")}</span>
            <span className="font-semibold font-mono text-neutral-900">
              {formatMoney(invoice.total, { currency: invoice.currency })}
            </span>
          </div>
          {invoice.paidAmount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>{tForm("paidAmount")}</span>
              <span className="font-semibold font-mono">
                {formatMoney(invoice.paidAmount, { currency: invoice.currency })}
              </span>
            </div>
          )}
          <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-bold text-neutral-900">
            <span>{tForm("remainingAmount")}</span>
            <span
              className={`font-mono ${invoice.remainingAmount > 0 ? "text-amber-800" : "text-emerald-700"}`}
            >
              {formatMoney(invoice.remainingAmount, { currency: invoice.currency })}
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

      <section className="mt-16 grid grid-cols-2 gap-10 print:mt-20">
        <div>
          <p className="text-xs text-neutral-500">{tForm("supplierSignature")}</p>
          <div className="mt-10 border-b border-neutral-400" aria-hidden />
        </div>
        <div>
          <p className="text-xs text-neutral-500">{tForm("clientSignature")}</p>
          <div className="mt-10 border-b border-neutral-400" aria-hidden />
        </div>
      </section>

      <footer className="mt-10 border-t border-dashed border-neutral-300 pt-4 text-center text-xs text-neutral-400">
        <p>{tForm("thanks")} · {invoice.businessName}</p>
        <p className="mt-1">{tCommon("appName")} · {formatDate(new Date().toISOString())}</p>
        <span className="sr-only">{tDashboard("from")}</span>
      </footer>
    </article>
  );
}

function InvoicePosLayout({
  invoice,
  tForm,
  tCommon,
  tDashboard,
  tBrand,
}: {
  invoice: InvoicePrintView;
  tForm: TFn;
  tCommon: TFn;
  tDashboard: TFn;
  tBrand: TFn;
}) {
  return (
    <article className="invoice-sheet invoice-sheet-pos text-neutral-900">
      <header className="border-b border-dashed border-neutral-400 pb-3 text-center">
        <p className="text-[11px] text-neutral-500">{tForm("title")}</p>
        <BrandBlock invoice={invoice} tBrand={tBrand} compact />
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
        {invoice.projectName && (
          <p className="text-neutral-600">
            {tForm("project")}: {invoice.projectName}
          </p>
        )}
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
            className="border-b border-dotted border-neutral-200 py-2 text-[11px]"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex-1">{item.description}</span>
              <span className="shrink-0 font-medium">
                {formatMoney(item.amount, { currency: invoice.currency })}
              </span>
            </div>
            <p className="mt-0.5 text-[10px] text-neutral-500">
              {item.quantity} × {formatMoney(item.unitPrice, { currency: invoice.currency })}
            </p>
          </div>
        ))}
      </section>

      <section className="border-t-2 border-neutral-800 py-3 text-[11px]">
        {invoice.taxEnabled && (
          <>
            <div className="flex justify-between py-0.5 text-neutral-600">
              <span>{tForm("subtotal")}</span>
              <span>{formatMoney(invoice.subtotal, { currency: invoice.currency })}</span>
            </div>
            <div className="flex justify-between py-0.5 text-neutral-600">
              <span>
                {tForm("taxAmount")} ({invoice.taxRatePercent}%)
              </span>
              <span>{formatMoney(invoice.taxAmount, { currency: invoice.currency })}</span>
            </div>
          </>
        )}
        <div className="flex items-center justify-between text-sm font-bold">
          <span>{tForm("total")}</span>
          <span>{formatMoney(invoice.total, { currency: invoice.currency })}</span>
        </div>
      </section>

      {invoice.notes && (
        <section className="border-t border-dashed border-neutral-300 py-2 text-[10px] text-neutral-600">
          <p className="font-medium text-neutral-800">{tForm("notes")}</p>
          <p className="mt-1 whitespace-pre-wrap">{invoice.notes}</p>
        </section>
      )}

      <p className="mt-3 text-center text-[9px] text-neutral-400">
        {tForm("thanks")} · {tCommon("appName")}
      </p>
      <span className="sr-only">{tDashboard("from")}</span>
    </article>
  );
}
