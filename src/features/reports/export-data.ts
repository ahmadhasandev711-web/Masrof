import "server-only";

/**
 * Compatibility barrel. Prefer `@/features/reports/reports.service` for gated export reads.
 */
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceAccess } from "@/features/workspaces/access";
import {
  reportsService,
  toExportPayloadOrError,
  type ReportExportPayload,
} from "@/features/reports/reports.service";
import type { ReportRangePreset } from "@/features/reports/date-ranges";

export type { ReportExportPayload };

export async function fetchReportExportPayload(input: {
  workspaceId: string;
  preset: ReportRangePreset;
  from?: string;
  to?: string;
}): Promise<ReportExportPayload | { error: string }> {
  const session = await requireSession();
  await verifyWorkspaceAccess(session.user.id, input.workspaceId);

  const result = await reportsService.getExportPayload(session.user.id, input);
  return toExportPayloadOrError(result);
}
