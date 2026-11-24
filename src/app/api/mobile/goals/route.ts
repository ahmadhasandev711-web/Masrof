import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { validationErrorCode } from "@/lib/mobile/validation";
import {
  createSavingsGoalSchema,
  createUpdateGoalProgressSchema,
} from "@/features/savings-goals/schemas";
import { savingsGoalsService } from "@/features/savings-goals/savings-goals.service";
import { getEffectiveSubscriptionForWorkspace } from "@/features/subscriptions/data";
import { getPlanQuantityLimit } from "@/features/subscriptions/plan-config-data";
import { countSavingsGoalsForWorkspace, toQuantityUsage } from "@/features/subscriptions/plan-usage";
import { CACHE_TAGS } from "@/lib/cache-tags";
import {
  requireMobileSession,
  requireMobileWorkspace,
  serializeId,
} from "@/lib/mobile/session";
import { toMobileGoal } from "@/lib/mobile/serialize";
import {
  mobileGoalArchiveBodySchema,
  mobileGoalsListResponseSchema,
} from "@contracts/mobile/goals";
import { mobileOkSchema } from "@contracts/mobile/common";
import { requirePlanFeature } from "@/server/kernel/plan-policy";
import { resultToResponse, thrownToMobileResponse } from "@/server/kernel";

function revalidateGoals() {
  revalidateTag(CACHE_TAGS.goals, "max");
  revalidatePath("/dashboard/goals");
}

export async function GET(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  const access = await requireMobileWorkspace(session.user.id, workspaceId, "read");
  if (access instanceof NextResponse) return access;

  const feature = await requirePlanFeature(session.user.id, access.workspaceId, "savingsGoals");
  if (!feature.ok) return resultToResponse(feature);

  try {
    const [goals, used, subscription] = await Promise.all([
      savingsGoalsService.listForWorkspace(access.workspaceId),
      countSavingsGoalsForWorkspace(access.workspaceId),
      getEffectiveSubscriptionForWorkspace(session.user.id, access.workspaceId),
    ]);
    const limit = await getPlanQuantityLimit(subscription.plan, "maxSavingsGoals");
    return NextResponse.json(
      mobileGoalsListResponseSchema.parse({
        items: goals.map((goal) => toMobileGoal(goal as unknown as Record<string, unknown>)),
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
    const parsed = createSavingsGoalSchema((key) => key).safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: validationErrorCode(parsed.error) }, { status: 400 });
    }

    const access = await requireMobileWorkspace(session.user.id, parsed.data.workspaceId, "write");
    if (access instanceof NextResponse) return access;

    const result = await savingsGoalsService.create(session.user.id, parsed.data);
    if (!result.ok) return resultToResponse(result);

    revalidateGoals();
    return NextResponse.json({ id: serializeId(result.value._id) }, { status: 201 });
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}

/** Add saved amount, or archive the goal. Both go through `savingsGoalsService`. */
export async function PATCH(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json();
    const action = body && typeof body === "object" ? (body as { action?: unknown }).action : undefined;

    if (action === "archive") {
      const parsed = mobileGoalArchiveBodySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "invalidData" }, { status: 400 });
      }
      const access = await requireMobileWorkspace(session.user.id, parsed.data.workspaceId, "write");
      if (access instanceof NextResponse) return access;

      const result = await savingsGoalsService.archive(
        session.user.id,
        parsed.data.goalId,
        access.workspaceId,
      );
      if (!result.ok) return resultToResponse(result);

      revalidateGoals();
      return NextResponse.json(mobileOkSchema.parse({ ok: true }));
    }

    if (action === "progress") {
      const parsed = createUpdateGoalProgressSchema((key) => key).safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: validationErrorCode(parsed.error) }, { status: 400 });
      }
      const access = await requireMobileWorkspace(session.user.id, parsed.data.workspaceId, "write");
      if (access instanceof NextResponse) return access;

      const result = await savingsGoalsService.updateProgress(session.user.id, parsed.data);
      if (!result.ok) return resultToResponse(result);

      revalidateGoals();
      return NextResponse.json(mobileOkSchema.parse({ ok: true }));
    }

    return NextResponse.json({ error: "invalidData" }, { status: 400 });
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}
