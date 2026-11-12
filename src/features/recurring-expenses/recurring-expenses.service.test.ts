import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/features/recurring-expenses/recurring-expenses.repository", () => ({
  RecurringExpensesRepository: class {},
  recurringExpensesRepository: {},
  InvalidRecurringExpenseError: class extends Error {},
}));

vi.mock("@/server/kernel/plan-policy", () => ({
  requirePlanFeature: vi.fn(),
  requireQuantityLimit: vi.fn(),
}));

vi.mock("@/features/subscriptions/plan-usage", () => ({
  countRecurringExpensesForWorkspace: vi.fn(),
}));

import { RecurringExpensesService } from "@/features/recurring-expenses/recurring-expenses.service";
import { requirePlanFeature, requireQuantityLimit } from "@/server/kernel/plan-policy";
import { countRecurringExpensesForWorkspace } from "@/features/subscriptions/plan-usage";
import { ok, err } from "@/server/kernel/result";
import { PlanFeatureError, PlanLimitError, NotFoundError } from "@/server/kernel/errors";

describe("RecurringExpensesService", () => {
  const repo = {
    findByIdempotencyKey: vi.fn(),
    create: vi.fn(),
    archive: vi.fn(),
  };
  const service = new RecurringExpensesService(repo as never);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requirePlanFeature).mockResolvedValue(ok(undefined));
    vi.mocked(requireQuantityLimit).mockResolvedValue(ok(undefined));
    vi.mocked(countRecurringExpensesForWorkspace).mockResolvedValue(0);
  });

  it("blocks create without feature", async () => {
    vi.mocked(requirePlanFeature).mockResolvedValue(err(new PlanFeatureError("rec")));
    const result = await service.create("u1", {
      workspaceId: "ws1",
      idempotencyKey: "r1",
    } as never);
    expect(result.ok).toBe(false);
  });

  it("blocks create at quantity limit", async () => {
    vi.mocked(requireQuantityLimit).mockResolvedValue(err(new PlanLimitError("max")));
    const result = await service.create("u1", {
      workspaceId: "ws1",
      idempotencyKey: "r1",
    } as never);
    expect(result.ok).toBe(false);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("NotFound on archive miss", async () => {
    repo.archive.mockResolvedValue(null);
    const result = await service.archive("r1", "ws1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBeInstanceOf(NotFoundError);
  });
});
