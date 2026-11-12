import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/features/accounts/accounts.repository", () => ({
  AccountsRepository: class {},
  accountsRepository: {},
}));

vi.mock("@/server/kernel/plan-policy", () => ({
  requirePlanFeature: vi.fn(),
}));

import { AccountsService } from "@/features/accounts/accounts.service";
import { requirePlanFeature } from "@/server/kernel/plan-policy";
import { ok, err } from "@/server/kernel/result";
import { PlanFeatureError, NotFoundError } from "@/server/kernel/errors";

describe("AccountsService", () => {
  const repo = {
    findByIdempotencyKey: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
    listForWorkspace: vi.fn(),
    getWorkspaceBalanceSummary: vi.fn(),
    getWorkspaceTotalBalance: vi.fn(),
  };
  const service = new AccountsService(repo as never);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requirePlanFeature).mockResolvedValue(ok(undefined));
  });

  it("requires multiCurrency when currency differs from workspace", async () => {
    vi.mocked(requirePlanFeature).mockResolvedValue(err(new PlanFeatureError("multi")));
    const result = await service.create(
      "u1",
      {
        workspaceId: "ws1",
        name: "USD Cash",
        type: "cash",
        currency: "USD",
        openingBalance: 0,
        idempotencyKey: "a1",
      },
      "EGP",
    );
    expect(result.ok).toBe(false);
    expect(requirePlanFeature).toHaveBeenCalledWith("u1", "ws1", "multiCurrency");
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("skips multiCurrency gate when currency matches workspace", async () => {
    repo.findByIdempotencyKey.mockResolvedValue(null);
    repo.create.mockResolvedValue({ _id: "acc1" });
    const result = await service.create(
      "u1",
      {
        workspaceId: "ws1",
        name: "Cash",
        type: "cash",
        currency: "EGP",
        openingBalance: 0,
        idempotencyKey: "a2",
      },
      "EGP",
    );
    expect(result.ok).toBe(true);
    expect(requirePlanFeature).not.toHaveBeenCalled();
  });

  it("returns NotFound on archive miss", async () => {
    repo.archive.mockResolvedValue(null);
    const result = await service.archive("x", "ws1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBeInstanceOf(NotFoundError);
  });
});
