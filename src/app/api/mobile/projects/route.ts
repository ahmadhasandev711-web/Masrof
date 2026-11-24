import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { validationErrorCode } from "@/lib/mobile/validation";
import {
  createProjectSchema,
  createUpdateProjectSchema,
  updateProjectStatusSchema,
} from "@/features/projects/schemas";
import { projectsService } from "@/features/projects/projects.service";
import { getEffectiveSubscriptionForWorkspace } from "@/features/subscriptions/data";
import { getPlanQuantityLimit } from "@/features/subscriptions/plan-config-data";
import {
  countActiveProjectsForWorkspace,
  toQuantityUsage,
} from "@/features/subscriptions/plan-usage";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { requireMobileSession, requireMobileWorkspace } from "@/lib/mobile/session";
import { toMobileProject } from "@/lib/mobile/serialize";
import {
  mobileProjectCreatedSchema,
  mobileProjectPatchBodySchema,
  mobileProjectsListResponseSchema,
} from "@contracts/mobile/projects";
import { mobileOkSchema } from "@contracts/mobile/common";
import { resultToResponse, thrownToMobileResponse } from "@/server/kernel";

/** Same data as /dashboard/projects: totals per project + the maxActiveProjects meter. */
export async function GET(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  const access = await requireMobileWorkspace(session.user.id, workspaceId, "read");
  if (access instanceof NextResponse) return access;

  try {
    const [items, used, subscription] = await Promise.all([
      projectsService.listWithTotals(access.workspaceId),
      countActiveProjectsForWorkspace(access.workspaceId),
      getEffectiveSubscriptionForWorkspace(session.user.id, access.workspaceId),
    ]);
    const limit = await getPlanQuantityLimit(subscription.plan, "maxActiveProjects");
    return NextResponse.json(
      mobileProjectsListResponseSchema.parse({
        items: items.map((item) => toMobileProject(item as unknown as Record<string, unknown>)),
        usage: toQuantityUsage(used, limit),
      }),
    );
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}

export async function POST(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json();
    // Identity translator: the issue message is the `validation.*` key the app translates.
    const parsed = createProjectSchema((key) => key).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: validationErrorCode(parsed.error) }, { status: 400 });
    }

    const access = await requireMobileWorkspace(session.user.id, parsed.data.workspaceId, "write");
    if (access instanceof NextResponse) return access;

    const result = await projectsService.create(session.user.id, parsed.data);
    if (!result.ok) {
      return resultToResponse(result);
    }

    revalidateTag(CACHE_TAGS.projects, "max");
    return NextResponse.json(
      mobileProjectCreatedSchema.parse(toMobileProject(result.value as Record<string, unknown>)),
      { status: 201 },
    );
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}

/** Change status or archive, through the same service methods as the web actions. */
export async function PATCH(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const parsed = mobileProjectPatchBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "invalidData" }, { status: 400 });
    }
    const body = parsed.data;
    const access = await requireMobileWorkspace(session.user.id, body.workspaceId, "write");
    if (access instanceof NextResponse) return access;

    if (body.action === "update") {
      const input = createUpdateProjectSchema((key) => key).safeParse({
        ...body,
        workspaceId: access.workspaceId,
      });
      if (!input.success) {
        return NextResponse.json({ error: validationErrorCode(input.error) }, { status: 400 });
      }
      const result = await projectsService.update(input.data);
      if (!result.ok) return resultToResponse(result);
    } else if (body.action === "status") {
      const input = updateProjectStatusSchema((key) => key).safeParse({
        ...body,
        workspaceId: access.workspaceId,
      });
      if (!input.success) {
        return NextResponse.json({ error: validationErrorCode(input.error) }, { status: 400 });
      }
      const result = await projectsService.updateStatus(session.user.id, input.data);
      if (!result.ok) return resultToResponse(result);
    } else {
      const result = await projectsService.archive(body.projectId, access.workspaceId);
      if (!result.ok) return resultToResponse(result);
    }

    revalidateTag(CACHE_TAGS.projects, "max");
    revalidatePath("/dashboard/projects");
    return NextResponse.json(mobileOkSchema.parse({ ok: true }));
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}
