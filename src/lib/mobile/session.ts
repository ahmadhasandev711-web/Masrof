import "server-only";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  verifyWorkspaceAccess,
  verifyWorkspaceWriteAccess,
  WorkspaceAccessDeniedError,
  WorkspaceWriteDeniedError,
  WorkspaceOwnerRequiredError,
} from "@/features/workspaces/access";

export type MobileSession = {
  user: { id: string; name: string; email: string };
};

export async function requireMobileSession(request: Request): Promise<MobileSession | NextResponse> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return {
    user: {
      id: session.user.id,
      name: session.user.name ?? "",
      email: session.user.email,
    },
  };
}

export async function requireMobileWorkspace(
  userId: string,
  workspaceId: string | null | undefined,
  mode: "read" | "write" = "read",
) {
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceIdRequired" }, { status: 400 });
  }
  try {
    const workspace =
      mode === "write"
        ? await verifyWorkspaceWriteAccess(userId, workspaceId)
        : await verifyWorkspaceAccess(userId, workspaceId);
    return { workspace, workspaceId };
  } catch (error) {
    return mobileErrorResponse(error);
  }
}

export function mobileErrorResponse(error: unknown) {
  if (error instanceof WorkspaceAccessDeniedError) {
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  }
  if (error instanceof WorkspaceWriteDeniedError) {
    return NextResponse.json({ error: "writeDenied" }, { status: 403 });
  }
  if (error instanceof WorkspaceOwnerRequiredError) {
    return NextResponse.json({ error: "ownerRequired" }, { status: 403 });
  }
  if (error instanceof Error && "code" in error && typeof (error as { code: unknown }).code === "string") {
    return NextResponse.json({ error: (error as { code: string }).code }, { status: 400 });
  }
  console.error("[mobile-api]", error);
  return NextResponse.json({ error: "unexpected" }, { status: 500 });
}

export function serializeId(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "_id" in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
}

export function populatedName(value: unknown): string | null {
  if (value && typeof value === "object" && "name" in value) {
    return String((value as { name: unknown }).name);
  }
  return null;
}
