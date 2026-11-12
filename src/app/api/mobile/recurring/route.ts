import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createRecurringExpenseSchema } from "@/features/recurring-expenses/schemas";
import { recurringExpensesService } from "@/features/recurring-expenses/recurring-expenses.service";
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

  const searchParams = new URL(request.url).searchParams;
  const workspaceId = searchParams.get("workspaceId");
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 100));
  const access = await requireMobileWorkspace(session.user.id, workspaceId, "read");
  if (access instanceof NextResponse) return access;

  const items = await recurringExpensesService.listForWorkspace(access.workspaceId, limit);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json();
    const parsed = createRecurringExpenseSchema(() => "invalid").safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalidData" }, { status: 400 });
    }

    const access = await requireMobileWorkspace(session.user.id, parsed.data.workspaceId, "write");
    if (access instanceof NextResponse) return access;

    const result = await recurringExpensesService.create(session.user.id, parsed.data);
    if (!result.ok) {
      return resultToResponse(result);
    }

    revalidateTag(CACHE_TAGS.recurring, "max");
    return NextResponse.json({ id: serializeId(result.value._id) }, { status: 201 });
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}

export async function PATCH(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const body = (await request.json()) as {
      workspaceId?: string;
      recurringId?: string;
      action?: string;
    };
    if (!body.recurringId || body.action !== "record") {
      return NextResponse.json({ error: "invalidData" }, { status: 400 });
    }

    const access = await requireMobileWorkspace(session.user.id, body.workspaceId, "write");
    if (access instanceof NextResponse) return access;

    const result = await recurringExpensesService.record(
      body.recurringId,
      access.workspaceId,
      session.user.id,
    );
    if (!result.ok) {
      return resultToResponse(result);
    }

    revalidateTag(CACHE_TAGS.recurring, "max");
    revalidateTag(CACHE_TAGS.budgets, "max");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}
