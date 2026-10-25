import "server-only";

import { cache } from "react";
import type { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { runInTransaction } from "@/lib/db/transaction";
import { WorkspaceModel, type WorkspaceDocument, type SupportedCurrency } from "@/models/workspace";
import { WorkspaceMembershipModel } from "@/models/workspace-membership";
import { AccountModel } from "@/models/account";
import { DebtModel } from "@/models/debt";
import { toMinorUnits } from "@/lib/money";
import type { CreateWorkspaceInput } from "@/features/workspaces/schemas";
import {
  findIdempotentResourceId,
  registerIdempotentResource,
} from "@/lib/idempotency/resolve";

/**
 * Creates a workspace, its owner membership, AND its first account,
 * all together — per the onboarding flow's requirement that a user lands
 * on a usable dashboard after one form submission, not an empty workspace
 * with nothing in it. All three writes commit together or none do.
 */
export async function createWorkspaceForUser(userId: string, input: CreateWorkspaceInput) {
  const userScope = { type: "user" as const, userId };
  const existingId = await findIdempotentResourceId(userScope, input.idempotencyKey);
  if (existingId) {
    return existingId;
  }

  const mongoose = await connectToDatabase();

  const workspaceId = await runInTransaction(mongoose, async (session) => {
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

  await registerIdempotentResource(userScope, input.idempotencyKey, "workspace", workspaceId);
  return workspaceId;
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

  const { workspaceHasTeamFeature } = await import("@/features/workspaces/members-data");

  // Check team-feature access for non-owner memberships in parallel (order preserved)
  // instead of awaiting each workspace sequentially.
  const checks = await Promise.all(
    results.map(async (item) => {
      if (item.role === "owner") return true;
      return workspaceHasTeamFeature(item.workspace._id.toString());
    }),
  );

  const accessible: (WorkspaceDocument & { _id: Types.ObjectId })[] = results
    .filter((_, index) => checks[index])
    .map((item) => item.workspace);

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

/**
 * Atomically updates the workspace base currency in MongoDB transaction:
 * - Updates workspace.currency
 * - Cleans up exchangeRates map if it previously had newCurrency as foreign
 * - Updates all base accounts that were using the previous base currency to newCurrency
 * - Updates debts using the old currency to newCurrency
 */
export async function updateWorkspaceBaseCurrency(
  workspaceId: string,
  newCurrency: SupportedCurrency,
) {
  const mongoose = await connectToDatabase();
  return runInTransaction(mongoose, async (session) => {
    const workspace = await WorkspaceModel.findById(workspaceId).session(session);
    if (!workspace) throw new Error("Workspace not found");

    const oldCurrency = workspace.currency;
    if (oldCurrency === newCurrency) {
      return workspace.toObject();
    }

    workspace.currency = newCurrency;
    if (workspace.exchangeRates && workspace.exchangeRates.has(newCurrency)) {
      workspace.exchangeRates.delete(newCurrency);
    }
    const sessionOptions = session ? { session } : {};
    await workspace.save(sessionOptions);

    await AccountModel.updateMany(
      { workspaceId: workspace._id, currency: { $in: [oldCurrency, null] } },
      { $set: { currency: newCurrency } },
      sessionOptions,
    );

    await DebtModel.updateMany(
      { workspaceId: workspace._id.toString(), currency: oldCurrency },
      { $set: { currency: newCurrency } },
      sessionOptions,
    );

    return workspace.toObject();
  });
}
