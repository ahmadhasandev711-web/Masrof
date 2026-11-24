import { NextResponse } from "next/server";
import { mobileTeamResponseSchema } from "@contracts/mobile/team";
import { workspacesService } from "@/features/workspaces/workspaces.service";
import { requireMobileSession, requireMobileWorkspace } from "@/lib/mobile/session";
import { requirePlanFeature } from "@/server/kernel/plan-policy";
import { resultToResponse, thrownToMobileResponse } from "@/server/kernel";

export async function GET(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  const access = await requireMobileWorkspace(session.user.id, workspaceId, "read");
  if (access instanceof NextResponse) return access;

  const feature = await requirePlanFeature(session.user.id, access.workspaceId, "teamWorkspace");
  if (!feature.ok) return resultToResponse(feature);

  try {
    const team = await workspacesService.listTeam(access.workspaceId);
    return NextResponse.json(
      mobileTeamResponseSchema.parse({
        members: team.members.map((member) => ({
          id: member.userId,
          name: member.name,
          email: member.email,
          role: member.role,
        })),
      }),
    );
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}
