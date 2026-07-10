"use client";

import { useTranslations } from "next-intl";

export function PrintToolbar() {
  const tReports = useTranslations("reports.export");
  const tCommon = useTranslations("common");
  return (
    <div className="mb-6 flex gap-3 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
      >
        {tReports("printPdf")}
      </button>
      <button
        type="button"
        onClick={() => window.close()}
        className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
      >
        {tCommon("cancel")}
      </button>
    </div>
  );
}
