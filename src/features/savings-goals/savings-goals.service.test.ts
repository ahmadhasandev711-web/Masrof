import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/features/savings-goals/savings-goals.repository", () => ({
  SavingsGoalsRepository: class {},
  savingsGoalsRepository: {},
}));

vi.mock("@/server/kernel/plan-policy", () => ({
  requirePlanFeature: vi.fn(),
  requireQuantityLimit: vi.fn(),
}));

vi.mock("@/features/subscriptions/plan-usage", () => ({
  countSavingsGoalsForWorkspace: vi.fn(),
}));

import { SavingsGoalsService } from "@/features/savings-goals/savings-goals.service";
import { requirePlanFeature, requireQuantityLimit } from "@/server/kernel/plan-policy";
import { countSavingsGoalsForWorkspace } from "@/features/subscriptions/plan-usage";
import { ok, err } from "@/server/kernel/result";
import { PlanFeatureError, PlanLimitError, NotFoundError } from "@/server/kernel/errors";

describe("SavingsGoalsService", () => {
  const repo = {
    findByIdempotencyKey: vi.fn(),
    create: vi.fn(),
    archive: vi.fn(),
    updateProgress: vi.fn(),
    listForWorkspace: vi.fn(),
  };
  const service = new SavingsGoalsService(repo as never);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requirePlanFeature).mockResolvedValue(ok(undefined));
    vi.mocked(requireQuantityLimit).mockResolvedValue(ok(undefined));
    vi.mocked(countSavingsGoalsForWorkspace).mockResolvedValue(0);
  });

  it("blocks create without feature", async () => {
    vi.mocked(requirePlanFeature).mockResolvedValue(err(new PlanFeatureError("goals")));
    const result = await service.create("u1", {
      workspaceId: "ws1",
      idempotencyKey: "g1",
    } as never);
    expect(result.ok).toBe(false);
  });

  it("blocks at quantity limit", async () => {
    vi.mocked(requireQuantityLimit).mockResolvedValue(err(new PlanLimitError("max")));
    const result = await service.create("u1", {
      workspaceId: "ws1",
      idempotencyKey: "g1",
    } as never);
    expect(result.ok).toBe(false);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("NotFound on archive miss", async () => {
    repo.archive.mockResolvedValue(null);
    const result = await service.archive("g1", "ws1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBeInstanceOf(NotFoundError);
  });
});
