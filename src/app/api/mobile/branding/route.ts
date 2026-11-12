import { NextResponse } from "next/server";
import { updateWorkspaceBrandingSchema } from "@/features/workspaces/branding-schema";
import { workspacesService } from "@/features/workspaces/workspaces.service";
import { requireWorkspaceOwner } from "@/features/workspaces/access";
import {
  requireMobileSession,
  requireMobileWorkspace,
} from "@/lib/mobile/session";
import { resultToResponse, thrownToMobileResponse } from "@/server/kernel";

export async function GET(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  const access = await requireMobileWorkspace(session.user.id, workspaceId, "read");
  if (access instanceof NextResponse) return access;

  return NextResponse.json(workspacesService.getBranding(access.workspace));
}

export async function POST(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json();
    const parsed = updateWorkspaceBrandingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalidData" }, { status: 400 });
    }

    await requireWorkspaceOwner(session.user.id, parsed.data.workspaceId);
    const result = await workspacesService.updateBranding(parsed.data);
    if (!result.ok) {
      return resultToResponse(result);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}
