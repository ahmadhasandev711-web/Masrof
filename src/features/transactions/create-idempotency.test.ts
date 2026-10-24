import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

import { createTransaction } from "@/features/transactions/data";
import { TransactionModel } from "@/models/transaction";
import { AccountModel } from "@/models/account";
import { ClientModel } from "@/models/client";
import { ProjectModel } from "@/models/project";
import { CategoryModel } from "@/models/category";

vi.mock("@/lib/db/mongoose", () => ({
  connectToDatabase: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/db/transaction", () => ({
  runInTransaction: vi.fn(async (_db, fn: (session: unknown) => Promise<unknown>) => fn({})),
}));

vi.mock("@/models/transaction", () => ({
  TransactionModel: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("@/models/account", () => ({
  AccountModel: {
    findOne: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  },
}));

vi.mock("@/models/client", () => ({
  ClientModel: { findOne: vi.fn() },
}));

vi.mock("@/models/project", () => ({
  ProjectModel: { findOne: vi.fn() },
}));

vi.mock("@/models/category", () => ({
  CategoryModel: { findOne: vi.fn() },
}));

describe("createTransaction idempotency", () => {
  const baseInput = {
    workspaceId: "507f1f77bcf86cd799439011",
    accountId: "507f1f77bcf86cd799439012",
    categoryId: "507f1f77bcf86cd799439013",
    type: "expense" as const,
    amount: 100,
    transactionDate: new Date("2026-10-01"),
    description: "",
    notes: "",
    idempotencyKey: "key-repeat-1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (AccountModel.findOne as any).mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: baseInput.accountId }),
    });
    (CategoryModel.findOne as any).mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: baseInput.categoryId }),
    });
    (AccountModel.findByIdAndUpdate as any).mockResolvedValue({});
  });

  it("returns existing transaction id without creating a duplicate", async () => {
    (TransactionModel.findOne as any).mockReturnValue({
      session: vi.fn().mockResolvedValue({ _id: { toString: () => "txn-existing" } }),
    });

    const id = await createTransaction(baseInput, "user-1");

    expect(id).toBe("txn-existing");
    expect(TransactionModel.create).not.toHaveBeenCalled();
    expect(AccountModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("creates a new transaction when idempotency key is new", async () => {
    (TransactionModel.findOne as any).mockReturnValue({
      session: vi.fn().mockResolvedValue(null),
    });
    (TransactionModel.create as any).mockResolvedValue([
      { _id: { toString: () => "txn-new" } },
    ]);

    const id = await createTransaction(baseInput, "user-1");

    expect(id).toBe("txn-new");
    expect(TransactionModel.create).toHaveBeenCalled();
    expect(AccountModel.findByIdAndUpdate).toHaveBeenCalled();
  });
});
