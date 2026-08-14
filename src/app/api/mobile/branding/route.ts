import { NextResponse } from "next/server";
import { updateWorkspace } from "@/features/workspaces/data";
import { updateWorkspaceBrandingSchema } from "@/features/workspaces/branding-schema";
import { requireWorkspaceOwner } from "@/features/workspaces/access";
import {
  mobileErrorResponse,
  requireMobileSession,
  requireMobileWorkspace,
} from "@/lib/mobile/session";

export async function GET(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  const access = await requireMobileWorkspace(session.user.id, workspaceId, "read");
  if (access instanceof NextResponse) return access;

  return NextResponse.json({
    businessName: access.workspace.businessName ?? "",
    logoUrl: access.workspace.logoUrl ?? "",
    taxId: access.workspace.taxId ?? "",
    businessPhone: access.workspace.businessPhone ?? "",
    businessAddress: access.workspace.businessAddress ?? "",
  });
}

export async function POST(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json();
    const parsed = updateWorkspaceBrandingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalidData" }, { status: 400 });
    }

    await requireWorkspaceOwner(session.user.id, parsed.data.workspaceId);
    await updateWorkspace(parsed.data.workspaceId, {
      businessName: parsed.data.businessName ?? "",
      logoUrl: parsed.data.logoUrl ?? "",
      taxId: parsed.data.taxId ?? "",
      businessPhone: parsed.data.businessPhone ?? "",
      businessAddress: parsed.data.businessAddress ?? "",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return mobileErrorResponse(error);
  }
}
