"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import { exportReportCsvAction } from "@/features/reports/actions/export-csv";
import { exportReportExcelAction } from "@/features/reports/actions/export-excel";
import type { ReportRangePreset } from "@/features/reports/date-ranges";
import { useTranslations } from "next-intl";

function buildPrintUrl(preset: ReportRangePreset, from?: string, to?: string) {
  const params = new URLSearchParams({ range: preset });
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  return `/print/report?${params.toString()}`;
}

export function ReportExportMenu({
  workspaceId,
  preset,
  from,
  to,
  canCsv = true,
  canPdf = true,
}: {
  workspaceId: string;
  preset: ReportRangePreset;
  from?: string;
  to?: string;
  canCsv?: boolean;
  canPdf?: boolean;
}) {
  const t = useTranslations("pages.reports");
  const tExport = useTranslations("reports.export");
  const tCommon = useTranslations("common");

  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [exportType, setExportType] = useState<"csv" | "excel" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleCsvExport() {
    setError(null);
    setExportType("csv");
    startTransition(async () => {
      const result = await exportReportCsvAction({ workspaceId, preset, from, to });
      setExportType(null);
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
      setIsOpen(false);
    });
  }

  function handleExcelExport() {
    setError(null);
    setExportType("excel");
    startTransition(async () => {
      const result = await exportReportExcelAction({ workspaceId, preset, from, to });
      setExportType(null);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      const byteCharacters = atob(result.base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      link.click();
      URL.revokeObjectURL(url);
      setIsOpen(false);
    });
  }

  return (
    <div ref={menuRef} className="relative inline-block text-start">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-neutral-800 shadow-2xs transition hover:bg-neutral-50 active:scale-95 disabled:opacity-60"
      >
        <span>{isPending ? tCommon("exporting") : t("exportMenu")}</span>
        <span className="text-[10px] text-neutral-400">▼</span>
      </button>

      {isOpen && (
        <div className="absolute end-0 mt-1.5 z-40 w-52 rounded-2xl border border-neutral-200/90 bg-white p-1.5 shadow-xl">
          {canCsv ? (
            <>
              <button
                type="button"
                onClick={handleExcelExport}
                disabled={isPending}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition text-start disabled:opacity-50"
              >
                <span>📊</span>
                <span>{exportType === "excel" ? tCommon("exporting") : tExport("excel")}</span>
              </button>

              <button
                type="button"
                onClick={handleCsvExport}
                disabled={isPending}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition text-start disabled:opacity-50"
              >
                <span>📄</span>
                <span>{exportType === "csv" ? tCommon("exporting") : tExport("csv")}</span>
              </button>
            </>
          ) : (
            <Link
              href="/pricing"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-emerald-800 hover:bg-emerald-50 transition"
            >
              <span>🔒</span>
              <span>{tExport("upgradeLink")}</span>
            </Link>
          )}

          {canPdf ? (
            <Link
              href={buildPrintUrl(preset, from, to)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition text-start border-t border-neutral-100 mt-1 pt-2"
            >
              <span>🖨️</span>
              <span>{tExport("printPdf")}</span>
            </Link>
          ) : null}

          {error && <p className="px-3 py-1.5 text-xs text-rose-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
