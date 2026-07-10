import Link from "next/link";
import type { ReportRangePreset } from "@/features/reports/date-ranges";
import { getTranslations } from "next-intl/server";

function buildPrintUrl(preset: ReportRangePreset, from?: string, to?: string) {
  const params = new URLSearchParams({ range: preset });
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  return `/print/report?${params.toString()}`;
}

export async function ExportPdfButton({
  preset,
  from,
  to,
}: {
  preset: ReportRangePreset;
  from?: string;
  to?: string;
}) {
  const tReports = await getTranslations("reports.export");
  return (
    <Link
      href={buildPrintUrl(preset, from, to)}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
    >
      {tReports("printPdf")}
    </Link>
  );
}
