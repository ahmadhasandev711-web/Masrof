import { describe, expect, it } from "vitest";
import { parseBackupJson } from "@/features/backup/schemas";

const legacyBackup = {
  version: 1,
  exportedAt: "2026-01-01T00:00:00.000Z",
  app: "sanadat",
  workspace: { name: "ورشة", type: "business", currency: "EGP" },
  collections: {
    categories: [],
    accounts: [],
    clients: [],
    projects: [],
    budgets: [],
    recurringExpenses: [],
    transactions: [],
    transfers: [],
    invoices: [],
    savingsGoals: [],
  },
  categoryIndex: [],
  meta: { includesArchived: true, counts: { accounts: 0 } },
};

describe("parseBackupJson", () => {
  it("accepts a backup exported before debts were included", () => {
    const parsed = parseBackupJson(JSON.stringify(legacyBackup));
    expect("errorCode" in parsed).toBe(false);
    if ("errorCode" in parsed) return;
    expect(parsed.collections.debts).toEqual([]);
    expect(parsed.collections.debtPayments).toEqual([]);
  });

  it("keeps debts that are present in the file", () => {
    const parsed = parseBackupJson(
      JSON.stringify({
        ...legacyBackup,
        collections: {
          ...legacyBackup.collections,
          debts: [{ _id: "d1", name: "قرض" }],
          debtPayments: [{ _id: "p1", debtId: "d1" }],
        },
      }),
    );
    expect("errorCode" in parsed).toBe(false);
    if ("errorCode" in parsed) return;
    expect(parsed.collections.debts).toHaveLength(1);
    expect(parsed.collections.debtPayments).toHaveLength(1);
  });
});
