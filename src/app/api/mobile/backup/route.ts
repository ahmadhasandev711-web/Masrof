import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireWorkspaceOwner } from "@/features/workspaces/access";
import { assertCanCreateWorkspace } from "@/features/subscriptions/data";
import {
  backupFilename,
  fetchWorkspaceBackupPayload,
} from "@/features/backup/export-data";
import { parseBackupJson } from "@/features/backup/schemas";
import { restoreWorkspaceFromBackup } from "@/features/backup/restore-data";
import type { AppLocale } from "@/i18n/config";
import { requireMobileSession, requireMobileWorkspace } from "@/lib/mobile/session";
import {
  mobileBackupExportResponseSchema,
  mobileBackupRestoreResponseSchema,
} from "@contracts/mobile/backup";
import { PlanLimitError } from "@/server/kernel/errors";
import { requirePlanFeature } from "@/server/kernel/plan-policy";
import { err, resultToResponse, thrownToMobileResponse } from "@/server/kernel";

function requestLocale(request: Request): AppLocale {
  return new URL(request.url).searchParams.get("locale") === "en" ? "en" : "ar";
}

export async function GET(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  const access = await requireMobileWorkspace(session.user.id, workspaceId, "read");
  if (access instanceof NextResponse) return access;

  try {
    await requireWorkspaceOwner(session.user.id, access.workspaceId);
    const feature = await requirePlanFeature(session.user.id, access.workspaceId, "workspaceBackup");
    if (!feature.ok) return resultToResponse(feature);

    const payload = await fetchWorkspaceBackupPayload(access.workspaceId);
    return NextResponse.json(
      mobileBackupExportResponseSchema.parse({
        filename: backupFilename(payload.workspace.name),
        json: JSON.stringify(payload, null, 2),
      }),
    );
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}

export async function POST(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const locale = requestLocale(request);

  try {
    const body = (await request.json()) as {
      workspaceId?: string;
      backupJson?: string;
      workspaceName?: string;
      confirmation?: string;
    };
    const access = await requireMobileWorkspace(session.user.id, body.workspaceId, "read");
    if (access instanceof NextResponse) return access;

    await requireWorkspaceOwner(session.user.id, access.workspaceId);
    const feature = await requirePlanFeature(session.user.id, access.workspaceId, "workspaceBackup");
    if (!feature.ok) return resultToResponse(feature);

    const limitError = await assertCanCreateWorkspace(session.user.id);
    if (limitError) return resultToResponse(err(new PlanLimitError(limitError)));

    const rawJson = String(body.backupJson ?? "");
    if (!rawJson) {
      return NextResponse.json({ error: "backupFileRequired" }, { status: 400 });
    }

    const parsed = parseBackupJson(rawJson);
    if ("errorCode" in parsed) {
      return NextResponse.json({ error: parsed.errorCode }, { status: 400 });
    }

    const tErrors = await getTranslations({ locale, namespace: "errors" });
    if (String(body.confirmation ?? "").trim() !== tErrors("backupConfirmWord")) {
      return NextResponse.json({ error: "backupConfirmPrompt" }, { status: 400 });
    }

    const { workspaceId } = await restoreWorkspaceFromBackup(
      session.user.id,
      parsed,
      String(body.workspaceName ?? "").trim() || undefined,
      tErrors("restoredWorkspaceSuffix"),
    );

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/backup");

    return NextResponse.json(mobileBackupRestoreResponseSchema.parse({ workspaceId }));
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}
