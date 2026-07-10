import { z } from "zod";
import { WORKSPACE_TYPES, SUPPORTED_CURRENCIES } from "@/models/workspace";
import { CATEGORY_KINDS } from "@/models/category";

export const BACKUP_VERSION = 1 as const;

const backupRecordSchema = z.record(z.string(), z.unknown());

export const workspaceBackupSchema = z.object({
  version: z.literal(BACKUP_VERSION),
  exportedAt: z.string(),
  app: z.literal("masrofaty"),
  workspace: z.object({
    name: z.string().min(1).max(120),
    type: z.enum(WORKSPACE_TYPES),
    currency: z.enum(SUPPORTED_CURRENCIES),
  }),
  collections: z.object({
    categories: z.array(backupRecordSchema),
    accounts: z.array(backupRecordSchema),
    clients: z.array(backupRecordSchema),
    projects: z.array(backupRecordSchema),
    budgets: z.array(backupRecordSchema),
    recurringExpenses: z.array(backupRecordSchema),
    transactions: z.array(backupRecordSchema),
    transfers: z.array(backupRecordSchema),
    invoices: z.array(backupRecordSchema),
    savingsGoals: z.array(backupRecordSchema),
  }),
  categoryIndex: z.array(
    z.object({
      _id: z.string(),
      slug: z.string().nullable(),
      isSystem: z.boolean(),
      name: z.string(),
      kind: z.enum(CATEGORY_KINDS),
    }),
  ),
  meta: z.object({
    includesArchived: z.literal(true),
    counts: z.record(z.string(), z.number()),
  }),
});

export type WorkspaceBackupManifest = z.infer<typeof workspaceBackupSchema>;
