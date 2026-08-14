import { NextResponse } from "next/server";
import { listWorkspaceMembers, listPendingInvitations } from "@/features/workspaces/members-data";
import {
  mobileErrorResponse,
  requireMobileSession,
  requireMobileWorkspace,
} from "@/lib/mobile/session";

export async function GET(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  const access = await requireMobileWorkspace(session.user.id, workspaceId, "read");
  if (access instanceof NextResponse) return access;

  try {
    const [members, invitations] = await Promise.all([
      listWorkspaceMembers(access.workspaceId),
      listPendingInvitations(access.workspaceId),
    ]);
    return NextResponse.json({ members, invitations });
  } catch (error) {
    return mobileErrorResponse(error);
  }
}
