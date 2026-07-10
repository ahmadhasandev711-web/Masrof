"use client";

import { exportReportExcelAction } from "@/features/reports/actions/export-excel";
import { ExportExcelButton } from "@/features/reports/components/export-excel-button";
import type { ReportRangePreset } from "@/features/reports/date-ranges";

export function ExportReportExcelButton({
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
  return (
    <ExportExcelButton
      onExport={() => exportReportExcelAction({ workspaceId, preset, from, to })}
    />
  );
}
