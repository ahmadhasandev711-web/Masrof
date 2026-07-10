"use client";

import { useState, useTransition } from "react";
import { exportReportCsvAction } from "@/features/reports/actions/export-csv";
import type { ReportRangePreset } from "@/features/reports/date-ranges";
import { useTranslations } from "next-intl";

export function ExportCsvButton({
  workspaceId,
  preset,
  from,
  to,
}: {
  workspaceId: string;
  preset: ReportRangePreset;
  from?: string;
  to?: string;
}) {
  const tReports = useTranslations("reports.export");
  const tCommon = useTranslations("common");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleExport() {
    setError(null);
    startTransition(async () => {
      const result = await exportReportCsvAction({ workspaceId, preset, from, to });
      if ("error" in result) {
        setError(result.error);
        return;
      }

      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleExport}
        disabled={isPending}
        className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-60"
      >
        {isPending ? tCommon("exporting") : tReports("csv")}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
