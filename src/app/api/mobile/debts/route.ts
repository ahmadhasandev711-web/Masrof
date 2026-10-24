import { NextResponse } from "next/server";
import { createDebtSchema } from "@/features/debts/schemas";
import {
  createDebt,
  getDebtsForWorkspace,
  getDebtSummary,
} from "@/features/debts/data";
import { assertPlanFeature } from "@/features/subscriptions/data";
import {
  mobileErrorResponse,
  requireMobileSession,
  requireMobileWorkspace,
} from "@/lib/mobile/session";

export async function GET(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  const status = url.searchParams.get("status") as "active" | "paid" | null;

  const access = await requireMobileWorkspace(session.user.id, workspaceId, "read");
  if (access instanceof NextResponse) return access;

  try {
    const [items, summary] = await Promise.all([
      getDebtsForWorkspace(access.workspaceId, status ? { status } : undefined),
      getDebtSummary(access.workspaceId, access.workspace.currency),
    ]);

    return NextResponse.json({
      items,
      summary,
    });
  } catch (error) {
    return mobileErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json();
    const parsed = createDebtSchema(() => "invalid").safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "invalidData" },
        { status: 400 },
      );
    }

    const access = await requireMobileWorkspace(session.user.id, parsed.data.workspaceId, "write");
    if (access instanceof NextResponse) return access;

    const featureError = await assertPlanFeature(session.user.id, "debts");
    if (featureError) {
      return NextResponse.json({ error: featureError }, { status: 403 });
    }

    const id = await createDebt({
      ...parsed.data,
      currency: access.workspace.currency,
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return mobileErrorResponse(error);
  }
}
