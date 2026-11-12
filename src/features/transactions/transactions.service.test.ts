import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/features/transactions/transactions.repository", () => ({
  TransactionsRepository: class {},
  transactionsRepository: {},
  InvalidTransactionReferenceError: class InvalidTransactionReferenceError extends Error {
    code: string;
    constructor(code: string) {
      super(code);
      this.code = code;
      this.name = "InvalidTransactionReferenceError";
    }
  },
}));

vi.mock("@/server/kernel/plan-policy", () => ({
  requirePlanFeature: vi.fn(),
}));

import { TransactionsService } from "@/features/transactions/transactions.service";
import { InvalidTransactionReferenceError } from "@/features/transactions/transactions.repository";
import { requirePlanFeature } from "@/server/kernel/plan-policy";
import { ok, err } from "@/server/kernel/result";
import { PlanFeatureError } from "@/server/kernel/errors";

describe("TransactionsService", () => {
  const repo = {
    create: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
    list: vi.fn(),
    listForExport: vi.fn(),
    getWorkspaceSummary: vi.fn(),
    getRecent: vi.fn(),
  };
  const service = new TransactionsService(repo as never);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requirePlanFeature).mockResolvedValue(ok(undefined));
  });

  it("create returns ok with id", async () => {
    repo.create.mockResolvedValue("tx1");
    const result = await service.create("u1", { workspaceId: "ws1" } as never);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe("tx1");
  });

  it("archive maps InvalidTransactionReferenceError", async () => {
    repo.archive.mockRejectedValue(new InvalidTransactionReferenceError("transactionNotFound"));
    const result = await service.archive("missing", "ws1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBeInstanceOf(InvalidTransactionReferenceError);
  });

  it("listForExport requires csvExport feature", async () => {
    vi.mocked(requirePlanFeature).mockResolvedValue(err(new PlanFeatureError("csv")));
    const result = await service.listForExport("u1", { workspaceId: "ws1" } as never);
    expect(result.ok).toBe(false);
    expect(requirePlanFeature).toHaveBeenCalledWith("u1", "ws1", "csvExport");
    expect(repo.listForExport).not.toHaveBeenCalled();
  });
});
