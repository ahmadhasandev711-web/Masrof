import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createProjectSchema } from "@/features/projects/schemas";
import { projectsService } from "@/features/projects/projects.service";
import { CACHE_TAGS } from "@/lib/cache-tags";
import {
  requireMobileSession,
  requireMobileWorkspace,
  serializeId,
} from "@/lib/mobile/session";
import { resultToResponse, thrownToMobileResponse } from "@/server/kernel";

export async function GET(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  const access = await requireMobileWorkspace(session.user.id, workspaceId, "read");
  if (access instanceof NextResponse) return access;

  const items = await projectsService.listWithTotals(access.workspaceId);
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

    const result = await projectsService.create(session.user.id, parsed.data);
    if (!result.ok) {
      return resultToResponse(result);
    }

    revalidateTag(CACHE_TAGS.projects, "max");
    return NextResponse.json(
      {
        id: serializeId(result.value._id),
        name: result.value.name,
        status: result.value.status,
      },
      { status: 201 },
    );
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}
