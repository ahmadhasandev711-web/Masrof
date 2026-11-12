"use client";

import Link from "next/link";
import type { InvoicePrintFormat } from "@/features/invoices/constants";
import { useTranslations } from "next-intl";

export function InvoicePrintToolbar({
  invoiceId,
  format,
  returnHref = "/dashboard/invoices",
}: {
  invoiceId: string;
  format: InvoicePrintFormat;
  returnHref?: string;
}) {
  const tReports = useTranslations("reports.export");
  const tCommon = useTranslations("common");
  const tForm = useTranslations("forms.invoice");
  const base = `/print/invoice/${invoiceId}`;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 print:hidden">
      <div className="flex rounded-xl border border-neutral-300 bg-white p-1">
        <Link
          href={`${base}?format=a4`}
          className={`min-h-11 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            format === "a4"
              ? "bg-emerald-700 text-white"
              : "text-neutral-600 hover:bg-neutral-50"
          }`}
        >
          A4
        </Link>
        <Link
          href={`${base}?format=pos`}
          className={`min-h-11 rounded-lg px-4 py-2 text-sm font-semibold transition ${
            format === "pos"
              ? "bg-emerald-700 text-white"
              : "text-neutral-600 hover:bg-neutral-50"
          }`}
        >
          {tForm("printThermal80")}
        </Link>
      </div>

      <button
        type="button"
        onClick={() => window.print()}
        className="min-h-11 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
      >
        {tReports("printPdf")}
      </button>
      <Link
        href={returnHref}
        className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
      >
        {tCommon("back")}
      </Link>

      {format === "pos" && (
        <p className="w-full text-xs text-neutral-500">
          Thermal printer tip: choose 80mm paper width if available.
        </p>
      )}
    </div>
  );
}
