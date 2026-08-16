import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import {
  createRecurringExpense,
  listRecurringExpenses,
  recordRecurringExpense,
} from "@/features/recurring-expenses/data";
import { createRecurringExpenseSchema } from "@/features/recurring-expenses/schemas";
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

  const searchParams = new URL(request.url).searchParams;
  const workspaceId = searchParams.get("workspaceId");
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 100));
  const access = await requireMobileWorkspace(session.user.id, workspaceId, "read");
  if (access instanceof NextResponse) return access;

  const items = await listRecurringExpenses(access.workspaceId, limit);
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

    const recurring = await createRecurringExpense(parsed.data);
    revalidateTag(CACHE_TAGS.recurring, "max");
    return NextResponse.json({ id: serializeId(recurring._id) }, { status: 201 });
  } catch (error) {
    return mobileErrorResponse(error);
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

    await recordRecurringExpense(body.recurringId, access.workspaceId, session.user.id);
    revalidateTag(CACHE_TAGS.recurring, "max");
    revalidateTag(CACHE_TAGS.budgets, "max");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return mobileErrorResponse(error);
  }
}
