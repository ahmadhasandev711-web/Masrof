import "server-only";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  verifyWorkspaceAccess,
  verifyWorkspaceWriteAccess,
} from "@/features/workspaces/access";
import { thrownToMobileResponse } from "@/server/kernel/http";

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
  if (mode === "write") {
    const { checkMemoryRateLimit } = await import("@/lib/rate-limit/memory");
    const rate = checkMemoryRateLimit(`mobile-write:${userId}`, 120, 60_000);
    if (!rate.ok) {
      return NextResponse.json(
        { error: "rateLimited", retryAfterSec: rate.retryAfterSec },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } },
      );
    }
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
  return thrownToMobileResponse(error);
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
