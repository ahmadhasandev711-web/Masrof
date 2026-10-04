import "server-only";

import { connectToDatabase } from "@/lib/db/mongoose";
import { toPlain } from "@/lib/db/plain";
import { WorkspaceModel } from "@/models/workspace";
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
import { BACKUP_VERSION, workspaceBackupSchema, type WorkspaceBackupManifest } from "@/features/backup/schemas";

function collectCategoryIds(docs: Array<Record<string, unknown>>, field = "categoryId") {
  const ids = new Set<string>();
  for (const doc of docs) {
    const value = doc[field];
    if (value) ids.add(String(value));
  }
  return ids;
}

export async function fetchWorkspaceBackupPayload(
  workspaceId: string,
): Promise<WorkspaceBackupManifest> {
  await connectToDatabase();

  const workspace = await WorkspaceModel.findById(workspaceId).lean();
  if (!workspace) {
    throw new Error("workspaceNotFound");
  }

  const [
    categories,
    accounts,
    clients,
    projects,
    budgets,
    recurringExpenses,
    transactions,
    transfers,
    invoices,
    savingsGoals,
  ] = await Promise.all([
    CategoryModel.find({ workspaceId, isSystem: false }).lean(),
    AccountModel.find({ workspaceId }).lean(),
    ClientModel.find({ workspaceId }).lean(),
    ProjectModel.find({ workspaceId }).lean(),
    BudgetModel.find({ workspaceId }).lean(),
    RecurringExpenseModel.find({ workspaceId }).lean(),
    TransactionModel.find({ workspaceId }).lean(),
    TransferModel.find({ workspaceId }).lean(),
    InvoiceModel.find({ workspaceId }).lean(),
    SavingsGoalModel.find({ workspaceId }).lean(),
  ]);

  const referencedCategoryIds = new Set<string>([
    ...collectCategoryIds(budgets as Array<Record<string, unknown>>),
    ...collectCategoryIds(recurringExpenses as Array<Record<string, unknown>>),
    ...collectCategoryIds(transactions as Array<Record<string, unknown>>),
  ]);

  const categoryIndexDocs = referencedCategoryIds.size
    ? await CategoryModel.find({ _id: { $in: [...referencedCategoryIds] } })
        .select("_id slug isSystem name kind")
        .lean()
    : [];

  const categoryIndex = categoryIndexDocs.map((category) => ({
    _id: String(category._id),
    slug: category.slug ?? null,
    isSystem: category.isSystem,
    name: category.name,
    kind: category.kind,
  }));

  const collections = {
    categories: toPlain(categories),
    accounts: toPlain(accounts),
    clients: toPlain(clients),
    projects: toPlain(projects),
    budgets: toPlain(budgets),
    recurringExpenses: toPlain(recurringExpenses),
    transactions: toPlain(transactions),
    transfers: toPlain(transfers),
    invoices: toPlain(invoices),
    savingsGoals: toPlain(savingsGoals),
  };

  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    app: "sanadat",
    workspace: {
      name: workspace.name,
      type: workspace.type,
      currency: workspace.currency,
    },
    collections,
    categoryIndex,
    meta: {
      includesArchived: true,
      counts: {
        categories: collections.categories.length,
        accounts: collections.accounts.length,
        clients: collections.clients.length,
        projects: collections.projects.length,
        budgets: collections.budgets.length,
        recurringExpenses: collections.recurringExpenses.length,
        transactions: collections.transactions.length,
        transfers: collections.transfers.length,
        invoices: collections.invoices.length,
        savingsGoals: collections.savingsGoals.length,
      },
    },
  };
}

export function backupFilename(workspaceName: string) {
  const safeName = workspaceName.replace(/[^\p{L}\p{N}]+/gu, "-").slice(0, 40) || "workspace";
  const date = new Date().toISOString().slice(0, 10);
  return `sanadat-backup-${safeName}-${date}.json`;
}

export const BACKUP_MAX_BYTES = 12 * 1024 * 1024;

export type BackupParseErrorCode = "backupTooLarge" | "backupInvalidJson" | "backupIncompatible";

export function parseBackupJson(
  raw: string,
): WorkspaceBackupManifest | { errorCode: BackupParseErrorCode } {
  if (raw.length > BACKUP_MAX_BYTES) {
    return { errorCode: "backupTooLarge" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { errorCode: "backupInvalidJson" };
  }

  const result = workspaceBackupSchema.safeParse(parsed);
  if (!result.success) {
    return { errorCode: "backupIncompatible" };
  }

  return result.data;
}