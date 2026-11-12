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

export type WorkspaceBrandingFields = {
  businessName?: string;
  logoUrl?: string;
  taxId?: string;
  businessPhone?: string;
  businessAddress?: string;
};

export type WorkspaceUpdateFields = WorkspaceBrandingFields & {
  name?: string;
  currency?: string;
  exchangeRates?: Record<string, number>;
};

export class WorkspacesRepository {
  async findIdempotentWorkspaceId(userId: string, idempotencyKey: string) {
    return findIdempotentResourceId({ type: "user", userId }, idempotencyKey);
  }

  /**
   * Creates a workspace, owner membership, and first account in one transaction.
   */
  async createWithOwnerAndAccount(userId: string, input: CreateWorkspaceInput): Promise<string> {
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
      await WorkspaceMembershipModel.deleteMany({ userId, role: { $ne: "owner" } }).session(
        session,
      );

      return workspace._id.toString();
    });

    await registerIdempotentResource(
      { type: "user", userId },
      input.idempotencyKey,
      "workspace",
      workspaceId,
    );
    return workspaceId;
  }

  /** Raw membership→workspace aggregation; caller applies team-feature filtering. */
  listMembershipWorkspaces = cache(async (userId: string) => {
    await connectToDatabase();

    return WorkspaceMembershipModel.aggregate<{
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
  });

  async findMembershipRoles(userId: string, workspaceIds: Types.ObjectId[]) {
    await connectToDatabase();
    return WorkspaceMembershipModel.find({
      userId,
      workspaceId: { $in: workspaceIds },
    }).lean();
  }

  async update(workspaceId: string, updates: WorkspaceUpdateFields) {
    await connectToDatabase();
    return WorkspaceModel.findByIdAndUpdate(workspaceId, updates, {
      returnDocument: "after",
    }).lean();
  }

  async archive(workspaceId: string) {
    await connectToDatabase();
    return WorkspaceModel.findByIdAndUpdate(
      workspaceId,
      { isArchived: true },
      { returnDocument: "after" },
    ).lean();
  }

  /**
   * Atomically updates base currency and cascades to accounts/debts.
   * Returns null if the workspace does not exist.
   */
  async updateBaseCurrency(workspaceId: string, newCurrency: SupportedCurrency) {
    const mongoose = await connectToDatabase();
    return runInTransaction(mongoose, async (session) => {
      const workspace = await WorkspaceModel.findById(workspaceId).session(session);
      if (!workspace) return null;

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
}

export const workspacesRepository = new WorkspacesRepository();
