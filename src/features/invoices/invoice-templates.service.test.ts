import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/features/invoices/invoice-templates.repository", () => ({
  InvoiceTemplatesRepository: class {},
  invoiceTemplatesRepository: {},
}));

vi.mock("@/server/kernel/plan-policy", () => ({
  requirePlanFeature: vi.fn(),
}));

import { InvoiceTemplatesService } from "@/features/invoices/invoice-templates.service";
import { requirePlanFeature } from "@/server/kernel/plan-policy";
import { ok, err } from "@/server/kernel/result";
import { PlanFeatureError, PlanLimitError, NotFoundError } from "@/server/kernel/errors";

describe("InvoiceTemplatesService", () => {
  const repo = {
    countForWorkspace: vi.fn(),
    nextSortOrder: vi.fn(),
    listForWorkspace: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    archive: vi.fn(),
    reorder: vi.fn(),
    maxPerWorkspace: 20,
  };
  const service = new InvoiceTemplatesService(repo as never);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requirePlanFeature).mockResolvedValue(ok(undefined));
    repo.countForWorkspace.mockResolvedValue(0);
    repo.nextSortOrder.mockResolvedValue(0);
  });

  it("blocks create at template limit", async () => {
    repo.countForWorkspace.mockResolvedValue(20);
    const result = await service.create("u1", {
      workspaceId: "ws1",
      name: "T",
      items: [{ description: "A", quantity: 1, unitPrice: 10 }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBeInstanceOf(PlanLimitError);
  });

  it("archives missing template as NotFound", async () => {
    repo.archive.mockResolvedValue(null);
    const result = await service.archive("u1", "ws1", "missing");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBeInstanceOf(NotFoundError);
  });

  it("reorders and returns list", async () => {
    repo.listForWorkspace.mockResolvedValue([{ id: "b" }, { id: "a" }]);
    const result = await service.reorder("u1", "ws1", ["b", "a"]);
    expect(result.ok).toBe(true);
    expect(repo.reorder).toHaveBeenCalledWith("ws1", ["b", "a"]);
  });

  it("blocks reorder without feature", async () => {
    vi.mocked(requirePlanFeature).mockResolvedValue(err(new PlanFeatureError("no")));
    const result = await service.reorder("u1", "ws1", ["a"]);
    expect(result.ok).toBe(false);
    expect(repo.reorder).not.toHaveBeenCalled();
  });
});
