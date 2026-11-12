import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import {
  createSavingsGoalSchema,
  createUpdateGoalProgressSchema,
} from "@/features/savings-goals/schemas";
import { savingsGoalsService } from "@/features/savings-goals/savings-goals.service";
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

  const goals = await savingsGoalsService.listForWorkspace(access.workspaceId);
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

    const result = await savingsGoalsService.create(session.user.id, parsed.data);
    if (!result.ok) {
      return resultToResponse(result);
    }

    revalidateTag(CACHE_TAGS.goals, "max");
    return NextResponse.json({ id: serializeId(result.value._id) }, { status: 201 });
  } catch (error) {
    return thrownToMobileResponse(error);
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

    const result = await savingsGoalsService.updateProgress(parsed.data);
    if (!result.ok) {
      return resultToResponse(result);
    }

    revalidateTag(CACHE_TAGS.goals, "max");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}
