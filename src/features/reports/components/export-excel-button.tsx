"use client";

import { useState, useTransition } from "react";
import { downloadBase64File } from "@/lib/download";
import { useTranslations } from "next-intl";

type ExportExcelButtonProps = {
  label?: string;
  pendingLabel?: string;
  onExport: () => Promise<{ base64: string; filename: string } | { error: string }>;
};

export function ExportExcelButton({
  label,
  pendingLabel,
  onExport,
}: ExportExcelButtonProps) {
  const tReports = useTranslations("reports.export");
  const tCommon = useTranslations("common");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const resolvedLabel = label ?? tReports("excel");
  const resolvedPendingLabel = pendingLabel ?? tCommon("exporting");

  function handleExport() {
    setError(null);
    startTransition(async () => {
      const result = await onExport();
      if ("error" in result) {
        setError(result.error);
        return;
      }

      downloadBase64File(
        result.base64,
        result.filename,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
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
        {isPending ? resolvedPendingLabel : resolvedLabel}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
