import Link from "next/link";
import { formatMoney } from "@/lib/money";
import type { InvoiceListItem } from "@/features/invoices/types";
import { getTranslations } from "next-intl/server";

function formatDate(isoDate: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(isoDate));
}

export async function InvoiceList({
  invoices,
  currency,
}: {
  invoices: InvoiceListItem[];
  currency: string;
}) {
  const tEmpty = await getTranslations("empty");
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
        <li
          key={invoice._id}
          className="flex items-center justify-between gap-4 rounded-xl border border-neutral-200 bg-white px-5 py-4 shadow-sm"
        >
          <div>
            <p className="font-medium text-neutral-900">{invoice.invoiceNumber}</p>
            <p className="text-sm text-neutral-500">
              {invoice.clientName} · {formatDate(invoice.issueDate)}
            </p>
            <p className="mt-1 text-sm font-semibold text-emerald-800">
              {formatMoney(invoice.total, { currency })}
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-1.5">
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
      ))}
    </ul>
  );
}
