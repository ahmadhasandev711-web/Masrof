import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

type SessionCall = { balanceUpdates: Array<{ accountId: unknown; inc: number }> };

const state: SessionCall & { committed: boolean; ended: boolean; created: unknown[] } = {
  balanceUpdates: [],
  committed: false,
  ended: false,
  created: [],
};

const fakeSession = {
  withTransaction: vi.fn(async (fn: () => Promise<void>) => {
    await fn();
    state.committed = true;
  }),
  endSession: vi.fn(async () => {
    state.ended = true;
  }),
};

const existingTransaction = {
  _id: "tx-1",
  accountId: "account-old",
  type: "expense" as "income" | "expense",
  amount: 5_000,
  isArchived: false,
  description: "",
  notes: "",
  transactionDate: new Date("2026-01-01"),
  categoryId: "category-1",
  save: vi.fn(async () => undefined),
};

vi.mock("mongoose", () => {
  class ObjectId {
    constructor(readonly value: string) {}
    toString() {
      return this.value;
    }
  }
  return {
    default: { Types: { ObjectId } },
    Types: { ObjectId },
  };
});

vi.mock("@/lib/db/mongoose", () => ({
  connectToDatabase: vi.fn(async () => ({ startSession: async () => fakeSession })),
}));

vi.mock("@/models/transaction", () => ({
  TransactionModel: {
    create: vi.fn(async (docs: unknown[]) => {
      state.created.push(docs[0]);
      return [{ _id: "tx-new" }];
    }),
    findOne: vi.fn(() => ({ session: () => Promise.resolve(existingTransaction) })),
  },
}));

vi.mock("@/models/account", () => ({
  AccountModel: {
    findOne: vi.fn(() => ({ session: () => Promise.resolve({ _id: "account-1" }) })),
    findByIdAndUpdate: vi.fn(async (accountId: unknown, update: { $inc: { cachedBalance: number } }) => {
      state.balanceUpdates.push({ accountId, inc: update.$inc.cachedBalance });
    }),
  },
}));

const foundDoc = { session: () => Promise.resolve({ _id: "any" }) };
vi.mock("@/models/category", () => ({ CategoryModel: { findOne: vi.fn(() => foundDoc) } }));
vi.mock("@/models/client", () => ({ ClientModel: { findOne: vi.fn(() => foundDoc) } }));
vi.mock("@/models/project", () => ({ ProjectModel: { findOne: vi.fn(() => foundDoc) } }));
vi.mock("@/lib/currency", () => ({ resolveAccountCurrency: () => "EGP" }));
vi.mock("@/lib/currency/transaction-pipeline", () => ({ transactionAccountCurrencyStages: () => [] }));
vi.mock("@/lib/currency/report-conversion", () => ({
  mergeConversionMeta: () => ({}),
  sumAmountsInBase: () => 0,
}));
vi.mock("@/features/workspaces/exchange-context", () => ({
  getWorkspaceExchangeContext: async () => ({ baseCurrency: "EGP", rates: {} }),
}));

const { createTransaction, updateTransaction, archiveTransaction } = await import(
  "@/features/transactions/data"
);

const baseInput = {
  workspaceId: "workspace-1",
  accountId: "account-1",
  categoryId: "category-1",
  transactionDate: new Date("2026-01-01"),
  description: "",
  notes: "",
};

beforeEach(() => {
  state.balanceUpdates = [];
  state.created = [];
  state.committed = false;
  state.ended = false;
  fakeSession.withTransaction.mockClear();
  existingTransaction.type = "expense";
  existingTransaction.amount = 5_000;
  existingTransaction.accountId = "account-old";
});

describe("createTransaction", () => {
  it("stores the amount in minor units and credits the account inside one transaction", async () => {
    await createTransaction({ ...baseInput, type: "income", amount: 100.5 }, "user-1");

    expect(fakeSession.withTransaction).toHaveBeenCalledOnce();
    expect(state.created[0]).toMatchObject({ amount: 10_050 });
    expect(state.balanceUpdates).toEqual([{ accountId: "account-1", inc: 10_050 }]);
    expect(state.committed).toBe(true);
    expect(state.ended).toBe(true);
  });

  it("debits the account for an expense", async () => {
    await createTransaction({ ...baseInput, type: "expense", amount: 20 }, "user-1");

    expect(state.balanceUpdates).toEqual([{ accountId: "account-1", inc: -2_000 }]);
  });
});

describe("updateTransaction", () => {
  it("reverses the old effect on the old account before applying the new one", async () => {
    await updateTransaction(
      {
        ...baseInput,
        transactionId: "tx-1",
        accountId: "account-new",
        type: "income",
        amount: 30,
        transactionDate: new Date("2026-01-02"),
      },
      "workspace-1",
    );

    expect(state.balanceUpdates).toEqual([
      { accountId: "account-old", inc: 5_000 },
      { accountId: "account-new", inc: 3_000 },
    ]);
  });
});

describe("archiveTransaction", () => {
  it("reverses the transaction's effect and soft-deletes it", async () => {
    await archiveTransaction("tx-1", "workspace-1");

    expect(state.balanceUpdates).toEqual([{ accountId: "account-old", inc: 5_000 }]);
    expect(existingTransaction.isArchived).toBe(true);
    expect(existingTransaction.save).toHaveBeenCalled();
  });
});
