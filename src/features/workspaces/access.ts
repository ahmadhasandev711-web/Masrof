import "server-only";

import { cache } from "react";
import type { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { WorkspaceMembershipModel, type WorkspaceRole } from "@/models/workspace-membership";
import { WorkspaceModel, type WorkspaceDocument } from "@/models/workspace";
import { canWorkspaceWrite, isWorkspaceOwner } from "@/features/workspaces/roles";

export { canWorkspaceWrite, isWorkspaceOwner };

export class WorkspaceAccessDeniedError extends Error {
  constructor(workspaceId: string) {
    super(`User does not have access to workspace ${workspaceId}`);
    this.name = "WorkspaceAccessDeniedError";
  }
}

export class WorkspaceOwnerRequiredError extends Error {
  constructor(workspaceId: string) {
    super(`Owner role required for workspace ${workspaceId}`);
    this.name = "WorkspaceOwnerRequiredError";
  }
}

export class WorkspaceWriteDeniedError extends Error {
  constructor(workspaceId: string) {
    super(`Write access denied for workspace ${workspaceId}`);
    this.name = "WorkspaceWriteDeniedError";
  }
}

export type WorkspaceAccessContext = {
  workspace: WorkspaceDocument & { _id: Types.ObjectId };
  membership: { role: WorkspaceRole; userId: string };
};

const loadWorkspaceAccess = cache(async function loadWorkspaceAccess(
  userId: string,
  workspaceId: string,
): Promise<WorkspaceAccessContext> {
  await connectToDatabase();

  const [membership, workspace] = await Promise.all([
    WorkspaceMembershipModel.findOne({
      workspaceId,
      userId,
    }).lean(),
    WorkspaceModel.findOne({
      _id: workspaceId,
      isArchived: false,
    }).lean(),
  ]);

  if (!membership) {
    throw new WorkspaceAccessDeniedError(workspaceId);
  }

  if (!workspace) {
    throw new WorkspaceAccessDeniedError(workspaceId);
  }

  if (membership.role !== "owner") {
    const { workspaceHasTeamFeature } = await import("@/features/workspaces/members-data");
    const hasTeam = await workspaceHasTeamFeature(workspaceId);
    if (!hasTeam) {
      throw new WorkspaceAccessDeniedError(workspaceId);
    }
  }

  return {
    workspace: workspace as WorkspaceDocument & { _id: Types.ObjectId },
    membership: {
      role: membership.role as WorkspaceRole,
      userId: membership.userId,
    },
  };
});

/**
 * THE central authorization gate for anything workspace-scoped.
 */
export async function verifyWorkspaceAccess(
  userId: string,
  workspaceId: string,
): Promise<WorkspaceDocument & { _id: Types.ObjectId }> {
  const { workspace } = await loadWorkspaceAccess(userId, workspaceId);
  return workspace;
}

export async function verifyWorkspaceWriteAccess(
  userId: string,
  workspaceId: string,
): Promise<WorkspaceDocument & { _id: Types.ObjectId }> {
  const access = await loadWorkspaceAccess(userId, workspaceId);
  if (access.membership.role === "viewer") {
    throw new WorkspaceWriteDeniedError(workspaceId);
  }
  return access.workspace;
}

export async function getWorkspaceAccess(
  userId: string,
  workspaceId: string,
): Promise<WorkspaceAccessContext> {
  return loadWorkspaceAccess(userId, workspaceId);
}

export async function requireWorkspaceOwner(
  userId: string,
  workspaceId: string,
): Promise<WorkspaceAccessContext> {
  const access = await loadWorkspaceAccess(userId, workspaceId);
  if (access.membership.role !== "owner") {
    throw new WorkspaceOwnerRequiredError(workspaceId);
  }
  return access;
}
