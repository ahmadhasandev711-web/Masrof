import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/features/invoices/invoices.repository", () => ({
  InvoicesRepository: class {},
  invoicesRepository: {},
}));

vi.mock("@/server/kernel/plan-policy", () => ({
  requirePlanFeature: vi.fn(),
  requireQuantityLimit: vi.fn(),
}));

vi.mock("@/features/subscriptions/plan-usage", () => ({
  countInvoicesCreatedThisMonth: vi.fn(),
}));

import { InvoicesService } from "@/features/invoices/invoices.service";
import { requirePlanFeature, requireQuantityLimit } from "@/server/kernel/plan-policy";
import { countInvoicesCreatedThisMonth } from "@/features/subscriptions/plan-usage";
import { ok, err } from "@/server/kernel/result";
import { PlanFeatureError, PlanLimitError } from "@/server/kernel/errors";
import { InvalidInvoiceReferenceError } from "@/features/invoices/invoices.errors";

describe("InvoicesService gates and archive/cancel", () => {
  const repo = {
    findByIdempotencyKey: vi.fn(),
    findActiveClient: vi.fn(),
    findActiveProjectForClient: vi.fn(),
    create: vi.fn(),
    findActiveInvoiceDoc: vi.fn(),
    paymentExists: vi.fn(),
    cancel: vi.fn(),
    archive: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    sumPaymentsForInvoice: vi.fn(),
  };

  const service = new InvoicesService(repo as never);

  const input = {
    workspaceId: "ws1",
    clientId: "c1",
    projectId: null,
    issueDate: new Date("2026-01-01"),
    dueDate: null,
    notes: "",
    items: [{ description: "A", amount: 100 }],
    idempotencyKey: "idem-inv",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requirePlanFeature).mockResolvedValue(ok(undefined));
    vi.mocked(requireQuantityLimit).mockResolvedValue(ok(undefined));
    vi.mocked(countInvoicesCreatedThisMonth).mockResolvedValue(0);
  });

  it("blocks create on missing plan feature", async () => {
    vi.mocked(requirePlanFeature).mockResolvedValue(err(new PlanFeatureError("feat")));
    const result = await service.create("u1", input);
    expect(result.ok).toBe(false);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("blocks create on monthly invoice limit", async () => {
    vi.mocked(countInvoicesCreatedThisMonth).mockResolvedValue(10);
    vi.mocked(requireQuantityLimit).mockResolvedValue(err(new PlanLimitError("limit")));
    const result = await service.create("u1", input);
    expect(result.ok).toBe(false);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("refuses cancel when payments exist", async () => {
    repo.findActiveInvoiceDoc.mockResolvedValue({ _id: "inv1" });
    repo.paymentExists.mockResolvedValue(true);
    const result = await service.cancel("inv1", "ws1");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBeInstanceOf(InvalidInvoiceReferenceError);
      expect(result.error.code).toBe("cannotCancelWithRecordedPayments");
    }
  });

  it("refuses archive when payments exist", async () => {
    repo.findActiveInvoiceDoc.mockResolvedValue({ _id: "inv1" });
    repo.paymentExists.mockResolvedValue(true);
    const result = await service.archive("inv1", "ws1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("cannotArchiveWithRecordedPayments");
  });

  it("cancels when no payments", async () => {
    repo.findActiveInvoiceDoc.mockResolvedValue({ _id: "inv1" });
    repo.paymentExists.mockResolvedValue(false);
    repo.cancel.mockResolvedValue({ _id: "inv1", status: "cancelled" });
    const result = await service.cancel("inv1", "ws1");
    expect(result.ok).toBe(true);
  });
});
