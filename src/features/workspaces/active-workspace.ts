import "server-only";

import { cookies } from "next/headers";

const ACTIVE_WORKSPACE_COOKIE = "masrofaty_active_workspace";

/**
 * Reads the "currently selected workspace" from a cookie.
 *
 * This is a UI convenience only, NOT a security boundary. Every actual
 * data operation still calls `verifyWorkspaceAccess(userId, workspaceId)`
 * before touching anything — a tampered cookie value simply fails that
 * check like any other untrusted client input would.
 */
export async function getActiveWorkspaceId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value ?? null;
}

export async function setActiveWorkspaceId(workspaceId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
