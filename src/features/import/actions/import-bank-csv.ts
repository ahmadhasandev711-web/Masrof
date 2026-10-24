"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { assertWorkspacePlanFeature } from "@/features/subscriptions/data";
import { createTransaction } from "@/features/transactions/data";

export type ImportBankCsvState = { error: string | null; imported: number };

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  result.push(current.trim());
  return result;
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[^\d.-]/g, "");
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) && value !== 0 ? Math.abs(value) : null;
}

function parseDate(raw: string): Date | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const iso = new Date(trimmed);
  if (!Number.isNaN(iso.getTime())) return iso;

  const parts = trimmed.split(/[/-]/);
  if (parts.length === 3) {
    const [a, b, c] = parts.map((p) => Number.parseInt(p, 10));
    if (a > 31) return new Date(a, b - 1, c);
    return new Date(c, b - 1, a);
  }

  return null;
}

export async function importBankCsvAction(
  _prev: ImportBankCsvState,
  formData: FormData,
): Promise<ImportBankCsvState> {
  const session = await requireSession();
  const tErrors = await getTranslations("errors");

  const workspaceId = String(formData.get("workspaceId") ?? "");
  const accountId = String(formData.get("accountId") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "");
  const csvText = String(formData.get("csvText") ?? "");

  if (!workspaceId || !accountId || !categoryId || !csvText.trim()) {
    return { error: tErrors("importDataIncomplete"), imported: 0 };
  }

  await verifyWorkspaceWriteAccess(session.user.id, workspaceId);

  const featureError = await assertWorkspacePlanFeature(session.user.id, workspaceId, "bankImport");
  if (featureError) {
    return { error: featureError, imported: 0 };
  }

  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) {
    return { error: tErrors("importFileEmpty"), imported: 0 };
  }

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const dateIdx = header.findIndex((h) => h.includes("date") || h.includes("تاريخ"));
  const descIdx = header.findIndex((h) => h.includes("desc") || h.includes("وصف") || h.includes("details"));
  const amountIdx = header.findIndex((h) => h.includes("amount") || h.includes("مبلغ") || h.includes("debit") || h.includes("credit"));

  if (dateIdx === -1 || amountIdx === -1) {
    return {
      error: tErrors("importColumnsNotFound"),
      imported: 0,
    };
  }

  let imported = 0;
  const importBatchId = crypto.randomUUID();

  for (const [lineIndex, line] of lines.slice(1).entries()) {
    const cols = parseCsvLine(line);
    const amount = parseAmount(cols[amountIdx] ?? "");
    const date = parseDate(cols[dateIdx] ?? "");
    if (!amount || !date) continue;

    const description = descIdx >= 0 ? cols[descIdx] ?? "" : tErrors("importBankDefault");

    try {
      await createTransaction(
        {
          workspaceId,
          accountId,
          categoryId,
          type: "expense",
          amount,
          transactionDate: date,
          description: description.slice(0, 140),
          notes: tErrors("importBankNotes"),
          idempotencyKey: `csv:${importBatchId}:${lineIndex}`,
        },
        session.user.id,
      );
      imported++;
    } catch {
      // skip bad rows
    }
  }

  if (imported === 0) {
    return { error: tErrors("importNoRows"), imported: 0 };
  }

  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/import");
  return { error: null, imported };
}
