import "server-only";

import { cache } from "react";
import type { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { runInTransaction } from "@/lib/db/transaction";
import { WorkspaceModel, type WorkspaceDocument } from "@/models/workspace";
import { WorkspaceMembershipModel } from "@/models/workspace-membership";
import { AccountModel } from "@/models/account";
import { toMinorUnits } from "@/lib/money";
import type { CreateWorkspaceInput } from "@/features/workspaces/schemas";

/**
 * Creates a workspace, its owner membership, AND its first account,
 * all together — per the onboarding flow's requirement that a user lands
 * on a usable dashboard after one form submission, not an empty workspace
 * with nothing in it. All three writes commit together or none do.
 */
export async function createWorkspaceForUser(userId: string, input: CreateWorkspaceInput) {
  const mongoose = await connectToDatabase();

  return runInTransaction(mongoose, async (session) => {
    const [workspace] = await WorkspaceModel.create(
      [
        {
          name: input.name,
          type: input.type,
          currency: input.currency,
          ownerId: userId,
          plan: "free",
          planStatus: "active",
          planExpiresAt: null,
        },
      ],
      { session },
    );

    await WorkspaceMembershipModel.create(
      [
        {
          workspaceId: workspace._id,
          userId,
          role: "owner",
        },
      ],
      { session },
    );

    const openingBalanceMinor = toMinorUnits(input.initialAccountBalance);

    await AccountModel.create(
      [
        {
          workspaceId: workspace._id,
          name: input.initialAccountName,
          type: input.initialAccountType,
          currency: input.currency,
          openingBalance: openingBalanceMinor,
          cachedBalance: openingBalanceMinor,
        },
      ],
      { session },
    );

    // Clean up any previous non-owner memberships from expired teams
    await WorkspaceMembershipModel.deleteMany({ userId, role: { $ne: "owner" } }).session(session);

    return workspace._id.toString();
  });
}

/** Lists every non-archived workspace the given user belongs to, newest first. */
export const listWorkspacesForUser = cache(async (userId: string) => {
  await connectToDatabase();

  const results = await WorkspaceMembershipModel.aggregate<{
    role: string;
    workspace: WorkspaceDocument & { _id: Types.ObjectId };
  }>([
    { $match: { userId } },
    {
      $lookup: {
        from: WorkspaceModel.collection.name,
        localField: "workspaceId",
        foreignField: "_id",
        as: "workspace",
      },
    },
    { $unwind: "$workspace" },
    { $match: { "workspace.isArchived": false } },
    {
      $project: {
        role: 1,
        workspace: "$workspace",
      },
    },
    { $sort: { "workspace.createdAt": -1 } },
  ]);

  if (results.length === 0) return [];

  const accessible: (WorkspaceDocument & { _id: Types.ObjectId })[] = [];
  const { workspaceHasTeamFeature } = await import("@/features/workspaces/members-data");

  for (const item of results) {
    if (item.role === "owner") {
      accessible.push(item.workspace);
    } else {
      const hasTeam = await workspaceHasTeamFeature(item.workspace._id.toString());
      if (hasTeam) {
        accessible.push(item.workspace);
      }
    }
  }

  return accessible;
});

/** Returns true if the user has at least one accessible workspace. */
export async function userHasAnyWorkspace(userId: string): Promise<boolean> {
  const workspaces = await listWorkspacesForUser(userId);
  return workspaces.length > 0;
}

export async function updateWorkspace(
  workspaceId: string,
  updates: {
    name?: string;
    currency?: string;
    exchangeRates?: Record<string, number>;
    businessName?: string;
    logoUrl?: string;
    taxId?: string;
    businessPhone?: string;
    businessAddress?: string;
  },
) {
  await connectToDatabase();
  return WorkspaceModel.findByIdAndUpdate(workspaceId, updates, { returnDocument: "after" }).lean();
}

export async function archiveWorkspace(workspaceId: string) {
  await connectToDatabase();
  return WorkspaceModel.findByIdAndUpdate(
    workspaceId,
    { isArchived: true },
    { returnDocument: "after" },
  ).lean();
}
