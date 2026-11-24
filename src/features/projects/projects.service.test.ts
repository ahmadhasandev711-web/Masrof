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
import { PlanFeatureError, PlanLimitError, NotFoundError, InvalidReferenceError } from "@/server/kernel/errors";

describe("ProjectsService", () => {
  const repo = {
    findByIdempotencyKey: vi.fn(),
    findActive: vi.fn(),
    findActiveClient: vi.fn(),
    countInvoices: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    archive: vi.fn(),
    countOpenInvoices: vi.fn(),
    listForWorkspace: vi.fn(),
    listWithTotals: vi.fn(),
    listReceivable: vi.fn(),
  };
  const service = new ProjectsService(repo as never);

  beforeEach(() => {
    vi.clearAllMocks();
    repo.countOpenInvoices.mockResolvedValue(0);
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

  const updateInput = {
    workspaceId: "ws1",
    projectId: "p1",
    clientId: "c1" as string | null,
    name: "Project",
    expectedAmount: 1500,
    dueDate: null,
    description: "Notes",
  };

  it("refuses a client change when the project has invoices", async () => {
    repo.findActive.mockResolvedValue({ clientId: "c1" });
    repo.countInvoices.mockResolvedValue(2);
    const result = await service.update({ ...updateInput, clientId: "c2" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(InvalidReferenceError);
      expect(result.error.code).toBe("projectClientLocked");
    }
    expect(repo.update).not.toHaveBeenCalled();
  });

  it("allows a client change when the project has no invoices", async () => {
    repo.findActive.mockResolvedValue({ clientId: "c1" });
    repo.countInvoices.mockResolvedValue(0);
    repo.findActiveClient.mockResolvedValue({ _id: "c2" });
    repo.update.mockResolvedValue({ _id: "p1" });
    const result = await service.update({ ...updateInput, clientId: "c2" });
    expect(result.ok).toBe(true);
    expect(repo.findActiveClient).toHaveBeenCalledWith("c2", "ws1");
    expect(repo.update).toHaveBeenCalled();
  });

  it("updates other fields while invoices exist when the client stays the same", async () => {
    repo.findActive.mockResolvedValue({ clientId: "c1" });
    repo.countInvoices.mockResolvedValue(4);
    repo.findActiveClient.mockResolvedValue({ _id: "c1" });
    repo.update.mockResolvedValue({ _id: "p1", name: "Renamed" });
    const result = await service.update({ ...updateInput, name: "Renamed" });
    expect(result.ok).toBe(true);
    expect(repo.countInvoices).not.toHaveBeenCalled();
    expect(repo.update).toHaveBeenCalledWith("p1", "ws1", {
      clientId: "c1",
      name: "Renamed",
      expectedAmount: 1500,
      dueDate: null,
      description: "Notes",
    });
  });

  it("refuses to archive a project with invoices still due", async () => {
    repo.countOpenInvoices.mockResolvedValue(2);
    const result = await service.archive("x", "ws1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("projectHasOpenInvoices");
    expect(repo.archive).not.toHaveBeenCalled();
  });
});
