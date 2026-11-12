import { NextResponse } from "next/server";
import { createWorkspaceSchema } from "@/features/workspaces/schemas";
import { workspacesService } from "@/features/workspaces/workspaces.service";
import { requireMobileSession } from "@/lib/mobile/session";
import { resultToResponse, thrownToMobileResponse } from "@/server/kernel";

export async function GET(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const items = await workspacesService.listForUserWithRoles(session.user.id);
    return NextResponse.json({
      items,
      activeWorkspaceId: items[0]?.id ?? null,
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
    const parsed = createWorkspaceSchema(() => "invalid").safeParse({
      name: body.name,
      type: body.type,
      currency: body.currency || "EGP",
      initialAccountName: body.initialAccountName || "الخزينة النقدية",
      initialAccountType: body.initialAccountType || "cash",
      initialAccountBalance: body.initialAccountBalance || 0,
      idempotencyKey: body.idempotencyKey,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "invalidData" },
        { status: 400 },
      );
    }

    const result = await workspacesService.create(session.user.id, parsed.data);
    if (!result.ok) {
      return resultToResponse(result);
    }

    return NextResponse.json({ workspaceId: result.value }, { status: 201 });
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}
