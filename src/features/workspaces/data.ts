import "server-only";

import { cache } from "react";
import { connectToDatabase } from "@/lib/db/mongoose";
import { WorkspaceModel } from "@/models/workspace";
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
  const session = await mongoose.startSession();

  try {
    let createdWorkspaceId: string | undefined;

    await session.withTransaction(async () => {
      const [workspace] = await WorkspaceModel.create(
        [
          {
            name: input.name,
            type: input.type,
            currency: input.currency,
            ownerId: userId,
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

      createdWorkspaceId = workspace._id.toString();
    });

    return createdWorkspaceId!;
  } finally {
    await session.endSession();
  }
}

/** Lists every non-archived workspace the given user belongs to, newest first. */
export const listWorkspacesForUser = cache(async (userId: string) => {
  await connectToDatabase();

  const memberships = await WorkspaceMembershipModel.find({ userId }).lean();
  const workspaceIds = memberships.map((m) => m.workspaceId);

  if (workspaceIds.length === 0) {
    return [];
  }

  return WorkspaceModel.find({
    _id: { $in: workspaceIds },
    isArchived: false,
  })
    .sort({ createdAt: -1 })
    .lean();
});

/** Returns true if the user has at least one workspace (used to gate onboarding). */
export async function userHasAnyWorkspace(userId: string): Promise<boolean> {
  await connectToDatabase();
  const count = await WorkspaceMembershipModel.countDocuments({ userId }).limit(1);
  return count > 0;
}

export async function updateWorkspace(
  workspaceId: string,
  updates: { name?: string; currency?: string; exchangeRates?: Record<string, number> },
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
