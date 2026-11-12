import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createBudgetSchema } from "@/features/budgets/schemas";
import { budgetsService } from "@/features/budgets/budgets.service";
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

  const budgets = await budgetsService.listWithProgress(access.workspaceId);
  return NextResponse.json({
    items: budgets.map((budget) => ({
      id: serializeId(budget._id),
      name: budget.name,
      amount: budget.amount,
      spent: budget.spent,
      remaining: budget.remaining,
      percentage: budget.percentage,
      categoryId: budget.categoryId ? serializeId(budget.categoryId) : null,
    })),
  });
}

export async function POST(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json();
    const parsed = createBudgetSchema(() => "invalid").safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalidData" }, { status: 400 });
    }

    const access = await requireMobileWorkspace(session.user.id, parsed.data.workspaceId, "write");
    if (access instanceof NextResponse) return access;

    const result = await budgetsService.create(session.user.id, parsed.data);
    if (!result.ok) {
      return resultToResponse(result);
    }

    revalidateTag(CACHE_TAGS.budgets, "max");
    return NextResponse.json({ id: serializeId(result.value._id) }, { status: 201 });
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}
