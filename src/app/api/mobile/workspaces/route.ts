import { NextResponse } from "next/server";
import { listWorkspacesForUser } from "@/features/workspaces/data";
import { requireMobileSession } from "@/lib/mobile/session";

export async function GET(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const workspaces = await listWorkspacesForUser(session.user.id);
  const items = workspaces.map((ws) => ({
    id: String(ws._id),
    name: ws.name,
    type: ws.type,
    currency: ws.currency,
    businessName: ws.businessName ?? null,
  }));

  return NextResponse.json({
    items,
    activeWorkspaceId: items[0]?.id ?? null,
  });
}
