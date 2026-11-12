import { NextResponse } from "next/server";
import { createDebtSchema } from "@/features/debts/schemas";
import { debtsService } from "@/features/debts/debts.service";
import {
  requireMobileSession,
  requireMobileWorkspace,
} from "@/lib/mobile/session";
import { resultToResponse, thrownToMobileResponse } from "@/server/kernel";

export async function GET(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  const status = url.searchParams.get("status") as "active" | "paid" | null;

  const access = await requireMobileWorkspace(session.user.id, workspaceId, "read");
  if (access instanceof NextResponse) return access;

  const feature = await debtsService.requireAccess(session.user.id, access.workspaceId);
  if (!feature.ok) {
    return resultToResponse(feature);
  }

  try {
    const [items, summary] = await Promise.all([
      debtsService.listForWorkspace(access.workspaceId, status ? { status } : undefined),
      debtsService.getSummary(access.workspaceId, access.workspace.currency),
    ]);

    return NextResponse.json({
      items,
      summary,
    });
  } catch (error) {
    return thrownToMobileResponse(error);
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

    const result = await debtsService.create(session.user.id, {
      ...parsed.data,
      currency: access.workspace.currency,
    });
    if (!result.ok) {
      return resultToResponse(result);
    }

    return NextResponse.json({ id: result.value }, { status: 201 });
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}
