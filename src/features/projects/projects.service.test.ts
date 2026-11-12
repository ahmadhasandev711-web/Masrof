import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/features/projects/projects.repository", () => ({
  ProjectsRepository: class {},
  projectsRepository: {},
}));

vi.mock("@/server/kernel/plan-policy", () => ({
  requirePlanFeature: vi.fn(),
  requireQuantityLimit: vi.fn(),
}));

vi.mock("@/features/subscriptions/plan-usage", () => ({
  countActiveProjectsForWorkspace: vi.fn(),
}));

import { ProjectsService } from "@/features/projects/projects.service";
import { requirePlanFeature, requireQuantityLimit } from "@/server/kernel/plan-policy";
import { countActiveProjectsForWorkspace } from "@/features/subscriptions/plan-usage";
import { ok, err } from "@/server/kernel/result";
import { PlanFeatureError, PlanLimitError, NotFoundError } from "@/server/kernel/errors";

describe("ProjectsService", () => {
  const repo = {
    findByIdempotencyKey: vi.fn(),
    create: vi.fn(),
    archive: vi.fn(),
    listForWorkspace: vi.fn(),
    listWithTotals: vi.fn(),
    listReceivable: vi.fn(),
  };
  const service = new ProjectsService(repo as never);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requirePlanFeature).mockResolvedValue(ok(undefined));
    vi.mocked(requireQuantityLimit).mockResolvedValue(ok(undefined));
    vi.mocked(countActiveProjectsForWorkspace).mockResolvedValue(0);
  });

  const input = {
    workspaceId: "ws1",
    clientId: "c1",
    name: "Project",
    status: "active" as const,
    expectedAmount: null,
    dueDate: null,
    description: "",
    idempotencyKey: "idem-p1",
  };

  it("blocks create when feature missing", async () => {
    vi.mocked(requirePlanFeature).mockResolvedValue(err(new PlanFeatureError("no")));
    const result = await service.create("u1", input);
    expect(result.ok).toBe(false);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("checks active project limit for active status", async () => {
    vi.mocked(countActiveProjectsForWorkspace).mockResolvedValue(3);
    vi.mocked(requireQuantityLimit).mockResolvedValue(err(new PlanLimitError("max")));
    const result = await service.create("u1", input);
    expect(result.ok).toBe(false);
    expect(requireQuantityLimit).toHaveBeenCalled();
  });

  it("archives missing project as NotFound", async () => {
    repo.archive.mockResolvedValue(null);
    const result = await service.archive("x", "ws1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBeInstanceOf(NotFoundError);
  });
});
