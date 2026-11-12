import { NextResponse } from "next/server";
import { workspacesService } from "@/features/workspaces/workspaces.service";
import {
  requireMobileSession,
  requireMobileWorkspace,
} from "@/lib/mobile/session";
import { thrownToMobileResponse } from "@/server/kernel";

export async function GET(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  const access = await requireMobileWorkspace(session.user.id, workspaceId, "read");
  if (access instanceof NextResponse) return access;

  try {
    const team = await workspacesService.listTeam(access.workspaceId);
    return NextResponse.json(team);
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}
