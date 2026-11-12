import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/features/clients/clients.repository", () => ({
  ClientsRepository: class {},
  clientsRepository: {},
}));

vi.mock("@/server/kernel/plan-policy", () => ({
  requirePlanFeature: vi.fn(),
  requireQuantityLimit: vi.fn(),
}));

vi.mock("@/features/subscriptions/plan-usage", () => ({
  countClientsForWorkspace: vi.fn(),
}));

import { ClientsService } from "@/features/clients/clients.service";
import { requirePlanFeature, requireQuantityLimit } from "@/server/kernel/plan-policy";
import { countClientsForWorkspace } from "@/features/subscriptions/plan-usage";
import { ok, err } from "@/server/kernel/result";
import { PlanFeatureError, PlanLimitError, NotFoundError } from "@/server/kernel/errors";

describe("ClientsService", () => {
  const repo = {
    findByIdempotencyKey: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
    listForWorkspace: vi.fn(),
    listWithFinancials: vi.fn(),
  };

  const service = new ClientsService(repo as never);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requirePlanFeature).mockResolvedValue(ok(undefined));
    vi.mocked(requireQuantityLimit).mockResolvedValue(ok(undefined));
    vi.mocked(countClientsForWorkspace).mockResolvedValue(0);
  });

  const input = {
    workspaceId: "ws1",
    name: "Client",
    email: null,
    phone: null,
    idempotencyKey: "idem-1",
  };

  it("blocks create when plan feature is missing", async () => {
    vi.mocked(requirePlanFeature).mockResolvedValue(err(new PlanFeatureError("upgrade")));
    const result = await service.create("user1", input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBeInstanceOf(PlanFeatureError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("blocks create when client quantity limit is reached", async () => {
    vi.mocked(countClientsForWorkspace).mockResolvedValue(5);
    vi.mocked(requireQuantityLimit).mockResolvedValue(err(new PlanLimitError("limit")));
    const result = await service.create("user1", input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBeInstanceOf(PlanLimitError);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("creates when gates pass", async () => {
    repo.findByIdempotencyKey.mockResolvedValue(null);
    repo.create.mockResolvedValue({ _id: "c1", name: "Client" });
    const result = await service.create("user1", input);
    expect(result.ok).toBe(true);
    expect(repo.create).toHaveBeenCalledWith(input);
  });

  it("returns NotFound when archive misses", async () => {
    repo.archive.mockResolvedValue(null);
    const result = await service.archive("missing", "ws1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBeInstanceOf(NotFoundError);
  });
});
