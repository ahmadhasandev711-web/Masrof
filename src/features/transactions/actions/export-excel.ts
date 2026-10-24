"use server";

import { getTranslations } from "next-intl/server";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceAccess } from "@/features/workspaces/access";
import { assertWorkspacePlanFeature } from "@/features/subscriptions/data";
import { listTransactionsForExport } from "@/features/transactions/data";
import { transactionFiltersSchema } from "@/features/transactions/schemas";
import { createWorkbook, workbookToBase64 } from "@/lib/excel";
import { fromMinorUnits } from "@/lib/money";
import { connectToDatabase } from "@/lib/db/mongoose";
import { WorkspaceModel } from "@/models/workspace";

function refName(value: unknown): string {
  if (!value || typeof value !== "object" || !("name" in value)) return "";
  return String((value as { name: string }).name);
}

function formatExportDate(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10);
}

export async function exportTransactionsExcelAction(input: {
  workspaceId: string;
  type?: string;
  accountId?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}): Promise<{ base64: string; filename: string; truncated: boolean } | { error: string }> {
  const session = await requireSession();
  await verifyWorkspaceAccess(session.user.id, input.workspaceId);

  const featureError = await assertWorkspacePlanFeature(session.user.id, input.workspaceId, "csvExport");
  if (featureError) {
    return { error: featureError };
  }

  const filters = transactionFiltersSchema.parse({
    workspaceId: input.workspaceId,
    type: input.type || undefined,
    accountId: input.accountId || undefined,
    categoryId: input.categoryId || undefined,
    dateFrom: input.dateFrom || undefined,
    dateTo: input.dateTo || undefined,
    search: input.search || undefined,
    page: 1,
  });

  const [tExport, tType, tErrors, { items, truncated }, workspace] = await Promise.all([
    getTranslations("reports.exportLabels"),
    getTranslations("transactionType"),
    getTranslations("errors"),
    listTransactionsForExport(filters),
    connectToDatabase().then(() =>
      WorkspaceModel.findById(input.workspaceId).select("name currency").lean(),
    ),
  ]);

  const workspaceName = workspace?.name ?? tErrors("workspaceDefault");
  const currency = workspace?.currency ?? "EGP";
  const generatedAt = new Date().toISOString().slice(0, 10);

  const workbook = createWorkbook([
    {
      name: tExport("transactionsSheet"),
      rows: [
        [tExport("transactionsExport")],
        [tExport("workspace"), workspaceName],
        [tExport("currency"), currency],
        [tExport("exportDate"), generatedAt],
        [tExport("rowCount"), items.length],
        ...(truncated
          ? [[tExport("note"), tExport("truncatedNote", { count: String(items.length) })]]
          : []),
        [],
        [
          tExport("date"),
          tExport("type"),
          tExport("amount"),
          tExport("account"),
          tExport("category"),
          tExport("description"),
          tExport("client"),
          tExport("project"),
          tExport("notes"),
        ],
        ...items.map((tx) => [
          formatExportDate(tx.transactionDate),
          tType(tx.type),
          fromMinorUnits(tx.amount),
          refName(tx.accountId),
          refName(tx.categoryId),
          tx.description ?? "",
          refName(tx.clientId),
          refName(tx.projectId),
          tx.notes ?? "",
        ]),
      ],
    },
  ]);

  return {
    base64: await workbookToBase64(workbook),
    filename: `sanadat-transactions-${generatedAt}.xlsx`,
    truncated,
  };
}
