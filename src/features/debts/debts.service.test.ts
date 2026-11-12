import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/features/debts/debts.repository", () => ({
  DebtsRepository: class {},
  debtsRepository: {},
}));

vi.mock("@/server/kernel/plan-policy", () => ({
  requirePlanFeature: vi.fn(),
}));

import { DebtsService } from "@/features/debts/debts.service";
import { requirePlanFeature } from "@/server/kernel/plan-policy";
import { ok, err } from "@/server/kernel/result";
import { PlanFeatureError } from "@/server/kernel/errors";
import { DebtNotFoundError } from "@/features/debts/debts.errors";

describe("DebtsService", () => {
  const repo = {
    create: vi.fn(),
    archive: vi.fn(),
    recordPayment: vi.fn(),
    listForWorkspace: vi.fn(),
    getSummary: vi.fn(),
    listPayments: vi.fn(),
  };
  const service = new DebtsService(repo as never);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requirePlanFeature).mockResolvedValue(ok(undefined));
  });

  it("blocks create without debts feature", async () => {
    vi.mocked(requirePlanFeature).mockResolvedValue(err(new PlanFeatureError("debts")));
    const result = await service.create("u1", {
      workspaceId: "ws1",
      counterpartyName: "Ali",
      type: "i_owe",
      originalAmount: 100,
      dueDate: null,
      notes: "",
      currency: "EGP",
      idempotencyKey: "d1",
    } as never);
    expect(result.ok).toBe(false);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("creates when feature allowed", async () => {
    repo.create.mockResolvedValue("debt1");
    const result = await service.create("u1", {
      workspaceId: "ws1",
      counterpartyName: "Ali",
      type: "i_owe",
      originalAmount: 100,
      dueDate: null,
      notes: "",
      currency: "EGP",
      idempotencyKey: "d1",
    } as never);
    expect(result.ok).toBe(true);
  });

  it("archive missing debt returns DebtNotFound", async () => {
    repo.archive.mockResolvedValue(false);
    const result = await service.archive("ws1", "missing");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBeInstanceOf(DebtNotFoundError);
  });
});
