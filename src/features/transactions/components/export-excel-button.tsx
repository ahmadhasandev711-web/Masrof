"use client";

import { useState, useTransition } from "react";
import { exportTransactionsExcelAction } from "@/features/transactions/actions/export-excel";
import { downloadBase64File } from "@/lib/download";
import { useTranslations } from "next-intl";

export function ExportTransactionsExcelButton({
  workspaceId,
  filters,
}: {
  workspaceId: string;
  filters: {
    type?: string;
    accountId?: string;
    categoryId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  };
}) {
  const tReports = useTranslations("reports.export");
  const tCommon = useTranslations("common");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleExport() {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await exportTransactionsExcelAction({ workspaceId, ...filters });
      if ("error" in result) {
        setError(result.error);
        return;
      }

      downloadBase64File(
        result.base64,
        result.filename,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );

      if (result.truncated) {
        setNotice(tReports("truncatedNotice"));
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleExport}
        disabled={isPending}
        className="rounded-lg border border-neutral-300 dark:border-[#26302C] bg-white dark:bg-[#1E2824] px-4 py-2 text-sm font-medium text-neutral-700 dark:text-[#ECEAE4] transition hover:bg-neutral-50 dark:hover:bg-[#26302C] disabled:opacity-60"
      >
        {isPending ? tCommon("exporting") : tReports("excel")}
      </button>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      {notice && <p className="text-xs text-amber-700 dark:text-amber-300">{notice}</p>}
    </div>
  );
}
