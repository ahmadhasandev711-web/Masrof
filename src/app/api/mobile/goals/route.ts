import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import {
  createSavingsGoal,
  listSavingsGoals,
  updateSavingsGoalProgress,
} from "@/features/savings-goals/data";
import { countSavingsGoalsForWorkspace } from "@/features/subscriptions/plan-usage";
import {
  createSavingsGoalSchema,
  createUpdateGoalProgressSchema,
} from "@/features/savings-goals/schemas";
import {
  assertWorkspacePlanFeature,
  assertWorkspaceQuantityLimit,
} from "@/features/subscriptions/data";
import { CACHE_TAGS } from "@/lib/cache-tags";
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

  const goals = await listSavingsGoals(access.workspaceId);
  return NextResponse.json({
    items: goals.map((goal) => ({
      id: serializeId(goal._id),
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      remaining: goal.remaining,
      percentage: goal.percentage,
      deadline: goal.deadline ?? null,
    })),
  });
}

export async function POST(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json();
    const parsed = createSavingsGoalSchema(() => "invalid").safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalidData" }, { status: 400 });
    }

    const access = await requireMobileWorkspace(session.user.id, parsed.data.workspaceId, "write");
    if (access instanceof NextResponse) return access;

    const featureError = await assertWorkspacePlanFeature(
      session.user.id,
      parsed.data.workspaceId,
      "savingsGoals",
    );
    if (featureError) {
      return NextResponse.json({ error: featureError }, { status: 403 });
    }

    const goalCount = await countSavingsGoalsForWorkspace(parsed.data.workspaceId);
    const limitError = await assertWorkspaceQuantityLimit(
      session.user.id,
      parsed.data.workspaceId,
      "maxSavingsGoals",
      goalCount,
    );
    if (limitError) {
      return NextResponse.json({ error: limitError }, { status: 403 });
    }

    const goal = await createSavingsGoal(parsed.data);
    revalidateTag(CACHE_TAGS.goals, "max");
    return NextResponse.json({ id: serializeId(goal._id) }, { status: 201 });
  } catch (error) {
    return mobileErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json();
    const parsed = createUpdateGoalProgressSchema(() => "invalid").safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalidData" }, { status: 400 });
    }

    const access = await requireMobileWorkspace(session.user.id, parsed.data.workspaceId, "write");
    if (access instanceof NextResponse) return access;

    await updateSavingsGoalProgress(parsed.data);
    revalidateTag(CACHE_TAGS.goals, "max");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return mobileErrorResponse(error);
  }
}
