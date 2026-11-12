import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/features/budgets/budgets.repository", () => ({
  BudgetsRepository: class {},
  budgetsRepository: {},
  InvalidBudgetCategoryError: class extends Error {},
}));

vi.mock("@/server/kernel/plan-policy", () => ({
  requirePlanFeature: vi.fn(),
}));

import { BudgetsService } from "@/features/budgets/budgets.service";
import { requirePlanFeature } from "@/server/kernel/plan-policy";
import { ok, err } from "@/server/kernel/result";
import { PlanFeatureError, NotFoundError } from "@/server/kernel/errors";

describe("BudgetsService", () => {
  const repo = {
    findByIdempotencyKey: vi.fn(),
    create: vi.fn(),
    archive: vi.fn(),
    listWithProgress: vi.fn(),
  };
  const service = new BudgetsService(repo as never);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requirePlanFeature).mockResolvedValue(ok(undefined));
  });

  it("blocks create without budgets feature", async () => {
    vi.mocked(requirePlanFeature).mockResolvedValue(err(new PlanFeatureError("budgets")));
    const result = await service.create("u1", {
      workspaceId: "ws1",
      categoryId: "cat1",
      amount: 100,
      period: "monthly",
      startDate: new Date(),
      idempotencyKey: "b1",
    } as never);
    expect(result.ok).toBe(false);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("NotFound on archive miss", async () => {
    repo.archive.mockResolvedValue(null);
    const result = await service.archive("b1", "ws1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBeInstanceOf(NotFoundError);
  });
});
