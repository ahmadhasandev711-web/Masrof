"use server";

import { getTranslations } from "next-intl/server";
import { getReportRangeLabel, type ReportRangePreset } from "@/features/reports/date-ranges";
import { fetchReportExportPayload } from "@/features/reports/export-data";
import { fromMinorUnits } from "@/lib/money";

function exportAmount(value: number | null): string | number {
  return value == null ? "N/A" : fromMinorUnits(value);
}

function csvEscape(value: string | number) {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function exportReportCsvAction(input: {
  workspaceId: string;
  preset: ReportRangePreset;
  from?: string;
  to?: string;
}): Promise<{ csv: string; filename: string } | { error: string }> {
  const [payload, t] = await Promise.all([
    fetchReportExportPayload(input),
    getTranslations("reports.exportLabels"),
  ]);

  if ("error" in payload) {
    return { error: payload.error };
  }

  const generatedAt = new Date().toISOString().slice(0, 10);
  const periodLabel = await getReportRangeLabel(payload.preset);

  const lines: string[] = [
    t("reportTitle"),
    `${t("workspace")},${csvEscape(payload.workspaceName)}`,
    `${t("currency")},${payload.currency}`,
    `${t("period")},${periodLabel}`,
    `${t("from")},${payload.range.from.toISOString().slice(0, 10)}`,
    `${t("to")},${payload.range.to.toISOString().slice(0, 10)}`,
    `${t("exportDate")},${generatedAt}`,
    "",
    t("summary"),
    `${t("income")},${exportAmount(payload.summary.income)}`,
    `${t("expenses")},${exportAmount(payload.summary.expense)}`,
    `${t("net")},${exportAmount(payload.summary.net)}`,
    "",
    t("expenseBreakdown"),
    `${t("category")},${t("amount")}`,
    ...payload.expenseBreakdown.map((row) => `${csvEscape(row.name)},${exportAmount(row.total)}`),
    "",
    t("incomeBreakdown"),
    `${t("category")},${t("amount")}`,
    ...payload.incomeBreakdown.map((row) => `${csvEscape(row.name)},${exportAmount(row.total)}`),
  ];

  const filename = `masrofaty-report-${payload.range.from.toISOString().slice(0, 10)}.csv`;
  return { csv: "\uFEFF" + lines.join("\n"), filename };
}
