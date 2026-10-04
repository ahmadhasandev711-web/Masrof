import "server-only";

import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { runInTransaction } from "@/lib/db/transaction";
import { WorkspaceModel } from "@/models/workspace";
import { WorkspaceMembershipModel } from "@/models/workspace-membership";
import { CategoryModel } from "@/models/category";
import { AccountModel } from "@/models/account";
import { ClientModel } from "@/models/client";
import { ProjectModel } from "@/models/project";
import { BudgetModel } from "@/models/budget";
import { RecurringExpenseModel } from "@/models/recurring-expense";
import { TransactionModel } from "@/models/transaction";
import { TransferModel } from "@/models/transfer";
import { InvoiceModel } from "@/models/invoice";
import { SavingsGoalModel } from "@/models/savings-goal";
import type { WorkspaceBackupManifest } from "@/features/backup/schemas";

function asObjectId(value: string | null | undefined) {
  if (!value) return null;
  return new mongoose.Types.ObjectId(value);
}

function mapRef(value: string | null | undefined, map: Map<string, string>) {
  if (!value) return null;
  return map.get(value) ?? value;
}

function omitKeys<T extends Record<string, unknown>>(doc: T, keys: string[]) {
  const copy = { ...doc };
  for (const key of keys) {
    delete copy[key];
  }
  return copy;
}

export async function restoreWorkspaceFromBackup(
  userId: string,
  manifest: WorkspaceBackupManifest,
  workspaceName?: string,
  restoredSuffix = "(restored)",
): Promise<{ workspaceId: string }> {
  const mongooseInstance = await connectToDatabase();

  const createdWorkspaceId = await runInTransaction(mongooseInstance, async (session) => {
    const customCategoryMap = new Map<string, string>();
      const accountMap = new Map<string, string>();
      const clientMap = new Map<string, string>();
      const projectMap = new Map<string, string>();

      const categorySlugMap = new Map(
        (
          await CategoryModel.find({ isSystem: true, slug: { $ne: null } })
            .select("_id slug")
            .session(session)
            .lean()
        ).map((category) => [String(category.slug), String(category._id)]),
      );

      const categoryIndexById = new Map(
        manifest.categoryIndex.map((category) => [category._id, category]),
      );

      function mapCategoryId(oldId: string | null | undefined): string | null {
        if (!oldId) return null;
        const mapped = customCategoryMap.get(oldId);
        if (mapped) return mapped;

        const meta = categoryIndexById.get(oldId);
        if (meta?.isSystem && meta.slug) {
          return categorySlugMap.get(meta.slug) ?? oldId;
        }

        return oldId;
      }

      const [workspace] = await WorkspaceModel.create(
        [
          {
            name: workspaceName?.trim() || `${manifest.workspace.name} ${restoredSuffix}`,
            type: manifest.workspace.type,
            currency: manifest.workspace.currency,
            ownerId: userId,
          },
        ],
        { session },
      );

      const newWorkspaceId = workspace._id;

      await WorkspaceMembershipModel.create(
        [{ workspaceId: newWorkspaceId, userId, role: "owner" }],
        { session },
      );

      for (const category of manifest.collections.categories) {
        const oldId = String(category._id);
        const doc = omitKeys(category, ["_id", "__v"]);
        const [created] = await CategoryModel.create(
          [
            {
              ...doc,
              workspaceId: newWorkspaceId,
              isSystem: false,
            },
          ],
          { session },
        );
        customCategoryMap.set(oldId, String(created._id));
      }

      for (const account of manifest.collections.accounts) {
        const oldId = String(account._id);
        const doc = omitKeys(account, ["_id", "__v"]);
        const [created] = await AccountModel.create(
          [{ ...doc, workspaceId: newWorkspaceId }],
          { session },
        );
        accountMap.set(oldId, String(created._id));
      }

      for (const client of manifest.collections.clients) {
        const oldId = String(client._id);
        const doc = omitKeys(client, ["_id", "__v"]);
        const [created] = await ClientModel.create(
          [{ ...doc, workspaceId: newWorkspaceId }],
          { session },
        );
        clientMap.set(oldId, String(created._id));
      }

      for (const project of manifest.collections.projects) {
        const oldId = String(project._id);
        const doc = omitKeys(project, ["_id", "__v"]);
        const [created] = await ProjectModel.create(
          [
            {
              ...doc,
              workspaceId: newWorkspaceId,
              clientId: asObjectId(mapRef(project.clientId as string | null, clientMap)),
            },
          ],
          { session },
        );
        projectMap.set(oldId, String(created._id));
      }

      if (manifest.collections.budgets.length > 0) {
        await BudgetModel.insertMany(
          manifest.collections.budgets.map((budget) => {
            const doc = omitKeys(budget, ["_id", "__v"]);
            return {
              ...doc,
              workspaceId: newWorkspaceId,
              categoryId: asObjectId(mapCategoryId(budget.categoryId as string | null)),
            };
          }),
          { session },
        );
      }

      if (manifest.collections.recurringExpenses.length > 0) {
        await RecurringExpenseModel.insertMany(
          manifest.collections.recurringExpenses.map((item) => {
            const doc = omitKeys(item, ["_id", "__v"]);
            return {
              ...doc,
              workspaceId: newWorkspaceId,
              accountId: asObjectId(mapRef(item.accountId as string, accountMap)),
              categoryId: asObjectId(mapCategoryId(item.categoryId as string)),
            };
          }),
          { session },
        );
      }

      if (manifest.collections.transactions.length > 0) {
        await TransactionModel.insertMany(
          manifest.collections.transactions.map((tx) => {
            const doc = omitKeys(tx, ["_id", "__v"]);
            return {
              ...doc,
              workspaceId: newWorkspaceId,
              accountId: asObjectId(mapRef(tx.accountId as string, accountMap)),
              categoryId: asObjectId(mapCategoryId(tx.categoryId as string)),
              clientId: asObjectId(mapRef(tx.clientId as string | null, clientMap)),
              projectId: asObjectId(mapRef(tx.projectId as string | null, projectMap)),
              createdBy: userId,
            };
          }),
          { session },
        );
      }

      if (manifest.collections.transfers.length > 0) {
        await TransferModel.insertMany(
          manifest.collections.transfers.map((transfer) => {
            const doc = omitKeys(transfer, ["_id", "__v"]);
            return {
              ...doc,
              workspaceId: newWorkspaceId,
              fromAccountId: asObjectId(mapRef(transfer.fromAccountId as string, accountMap)),
              toAccountId: asObjectId(mapRef(transfer.toAccountId as string, accountMap)),
              createdBy: userId,
            };
          }),
          { session },
        );
      }

      if (manifest.collections.invoices.length > 0) {
        await InvoiceModel.insertMany(
          manifest.collections.invoices.map((invoice) => {
            const doc = omitKeys(invoice, ["_id", "__v"]);
            return {
              ...doc,
              workspaceId: newWorkspaceId,
              clientId: asObjectId(mapRef(invoice.clientId as string, clientMap)),
            };
          }),
          { session },
        );
      }

      if (manifest.collections.savingsGoals.length > 0) {
        await SavingsGoalModel.insertMany(
          manifest.collections.savingsGoals.map((goal) => {
            const doc = omitKeys(goal, ["_id", "__v"]);
            return { ...doc, workspaceId: newWorkspaceId };
          }),
          { session },
        );
      }

      return String(newWorkspaceId);
    });

  if (!createdWorkspaceId) {
    throw new Error("backupRestoreWorkspaceFailed");
  }

  return { workspaceId: createdWorkspaceId };
}
