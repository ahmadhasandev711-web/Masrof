"use server";

import { getTranslations } from "next-intl/server";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { assertWorkspacePlanFeature } from "@/features/subscriptions/data";
import { backupFilename, fetchWorkspaceBackupPayload } from "@/features/backup/export-data";

export async function exportWorkspaceBackupAction(workspaceId: string): Promise<
  { json: string; filename: string } | { error: string }
> {
  const session = await requireSession();
  const tErrors = await getTranslations("errors");
  await verifyWorkspaceWriteAccess(session.user.id, workspaceId);

  const featureError = await assertWorkspacePlanFeature(session.user.id, workspaceId, "workspaceBackup");
  if (featureError) {
    return { error: featureError };
  }

  try {
    const payload = await fetchWorkspaceBackupPayload(workspaceId);
    return {
      json: JSON.stringify(payload, null, 2),
      filename: backupFilename(payload.workspace.name),
    };
  } catch (error) {
    console.error("[backup] export failed:", error);
    return { error: tErrors("backupExportFailed") };
  }
}
