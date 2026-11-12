import "server-only";

import { requireSession } from "@/features/auth/session";
import {
  verifyWorkspaceWriteAccess,
  type WorkspaceAccessContext,
  getWorkspaceAccess,
} from "@/features/workspaces/access";
import type { WorkspaceDocument } from "@/models/workspace";
import type { Types } from "mongoose";

export type WorkspaceWriteContext = {
  userId: string;
  workspaceId: string;
  workspace: WorkspaceDocument & { _id: Types.ObjectId };
};

/**
 * Single entry for authenticated workspace writes from Server Actions.
 * Mobile routes use requireMobileSession + requireMobileWorkspace instead,
 * then call the same domain service with userId.
 */
export async function runWorkspaceWrite<T>(
  workspaceId: string,
  work: (ctx: WorkspaceWriteContext) => Promise<T>,
): Promise<T> {
  const session = await requireSession();
  const workspace = await verifyWorkspaceWriteAccess(session.user.id, workspaceId);
  return work({
    userId: session.user.id,
    workspaceId,
    workspace,
  });
}

export async function runWorkspaceOwnerWrite<T>(
  workspaceId: string,
  work: (ctx: WorkspaceWriteContext & { access: WorkspaceAccessContext }) => Promise<T>,
): Promise<T> {
  const session = await requireSession();
  const { requireWorkspaceOwner } = await import("@/features/workspaces/access");
  const access = await requireWorkspaceOwner(session.user.id, workspaceId);
  return work({
    userId: session.user.id,
    workspaceId,
    workspace: access.workspace,
    access,
  });
}

export async function loadWorkspaceAccessCached(userId: string, workspaceId: string) {
  return getWorkspaceAccess(userId, workspaceId);
}
