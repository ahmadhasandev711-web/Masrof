import { NextResponse } from "next/server";
import {
  createWorkspaceForUser,
  listWorkspacesForUser,
} from "@/features/workspaces/data";
import { createWorkspaceSchema } from "@/features/workspaces/schemas";
import { assertCanCreateWorkspace } from "@/features/subscriptions/data";
import { requireMobileSession } from "@/lib/mobile/session";

export async function GET(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const workspaces = await listWorkspacesForUser(session.user.id);
  const { WorkspaceMembershipModel } = await import("@/models/workspace-membership");
  const memberships = await WorkspaceMembershipModel.find({
    userId: session.user.id,
    workspaceId: { $in: workspaces.map((w) => w._id) },
  }).lean();
  const roleMap = new Map(memberships.map((m) => [String(m.workspaceId), m.role]));

  const items = workspaces.map((ws) => ({
    id: String(ws._id),
    name: ws.name,
    type: ws.type,
    currency: ws.currency,
    businessName: ws.businessName ?? null,
    role: (roleMap.get(String(ws._id)) ?? "owner") as "owner" | "admin" | "member" | "viewer",
  }));

  return NextResponse.json({
    items,
    activeWorkspaceId: items[0]?.id ?? null,
  });
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

    const limitError = await assertCanCreateWorkspace(session.user.id);
    if (limitError) {
      return NextResponse.json({ error: limitError }, { status: 403 });
    }

    const workspaceId = await createWorkspaceForUser(session.user.id, parsed.data);

    return NextResponse.json({ workspaceId }, { status: 201 });
  } catch (error) {
    console.error("[mobile-workspaces-post]", error);
    return NextResponse.json({ error: "unexpected" }, { status: 500 });
  }
}
