import { NextResponse } from "next/server";
/** Team payload is still opaque — contract is `z.unknown()` until members/invitations are stabilized. */
import { mobileTeamResponseSchema } from "@contracts/mobile/team";
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
    // Pass-through parse documents the contract without constraining shape yet.
    return NextResponse.json(mobileTeamResponseSchema.parse(team));
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}
