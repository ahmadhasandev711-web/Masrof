import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createProject, listProjectsWithTotals } from "@/features/projects/data";
import { createProjectSchema } from "@/features/projects/schemas";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { countActiveProjectsForWorkspace } from "@/features/subscriptions/plan-usage";
import { assertWorkspacePlanFeature, assertWorkspaceQuantityLimit } from "@/features/subscriptions/data";
import {
  mobileErrorResponse,
  requireMobileSession,
  requireMobileWorkspace,
  serializeId,
} from "@/lib/mobile/session";

export async function GET(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  const access = await requireMobileWorkspace(session.user.id, workspaceId, "read");
  if (access instanceof NextResponse) return access;

  const items = await listProjectsWithTotals(access.workspaceId);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json();
    const parsed = createProjectSchema(() => "invalid").safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalidData" }, { status: 400 });
    }

    const access = await requireMobileWorkspace(session.user.id, parsed.data.workspaceId, "write");
    if (access instanceof NextResponse) return access;

    const featureError = await assertWorkspacePlanFeature(
      session.user.id,
      parsed.data.workspaceId,
      "clientsAndProjects",
    );
    if (featureError) {
      return NextResponse.json({ error: featureError }, { status: 403 });
    }

    if (parsed.data.status === "active") {
      const activeCount = await countActiveProjectsForWorkspace(parsed.data.workspaceId);
      const limitError = await assertWorkspaceQuantityLimit(
        session.user.id,
        parsed.data.workspaceId,
        "maxActiveProjects",
        activeCount,
      );
      if (limitError) {
        return NextResponse.json({ error: "planLimitReached", message: limitError }, { status: 403 });
      }
    }

    const project = await createProject(parsed.data);
    revalidateTag(CACHE_TAGS.projects, "max");
    return NextResponse.json(
      {
        id: serializeId(project._id),
        name: project.name,
        status: project.status,
      },
      { status: 201 },
    );
  } catch (error) {
    return mobileErrorResponse(error);
  }
}
