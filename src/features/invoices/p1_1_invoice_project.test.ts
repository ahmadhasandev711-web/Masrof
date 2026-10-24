import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

import { createInvoiceSchema } from "@/features/invoices/schemas";
import { createInvoice, InvalidInvoiceReferenceError } from "@/features/invoices/data";
import { ClientModel } from "@/models/client";
import { ProjectModel } from "@/models/project";
import { InvoiceModel } from "@/models/invoice";

vi.mock("@/lib/db/mongoose", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/models/client", () => ({
  ClientModel: {
    findOne: vi.fn(),
  },
}));

vi.mock("@/models/project", () => ({
  ProjectModel: {
    findOne: vi.fn(),
  },
}));

vi.mock("@/models/invoice", () => ({
  InvoiceModel: {
    countDocuments: vi.fn(),
    create: vi.fn(),
    findOne: vi.fn(),
  },
  INVOICE_STATUSES: ["draft", "sent", "paid", "cancelled"] as const,
}));

vi.mock("@/lib/idempotency/workspace-resource", () => ({
  findWorkspaceIdempotentId: vi.fn().mockResolvedValue(null),
  registerWorkspaceIdempotentResource: vi.fn().mockResolvedValue(undefined),
}));

const testIdempotencyKey = "test-invoice-idempotency-key";

describe("P1.1 — createInvoiceSchema with projectId", () => {
  const tValidation = (key: string) => key;
  const schema = createInvoiceSchema(tValidation as any);

  it("accepts valid invoice input without projectId", () => {
    const result = schema.safeParse({
      workspaceId: "ws-1",
      clientId: "client-1",
      issueDate: "2026-09-17",
      items: [{ description: "Consulting", amount: 500 }],
      idempotencyKey: testIdempotencyKey,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.projectId).toBeUndefined();
    }
  });

  it("accepts valid invoice input with projectId", () => {
    const result = schema.safeParse({
      workspaceId: "ws-1",
      clientId: "client-1",
      projectId: "project-123",
      issueDate: "2026-09-17",
      items: [{ description: "Consulting", amount: 500 }],
      idempotencyKey: testIdempotencyKey,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.projectId).toBe("project-123");
    }
  });

  it("normalizes empty or null projectId to null / undefined", () => {
    const result = schema.safeParse({
      workspaceId: "ws-1",
      clientId: "client-1",
      projectId: null,
      issueDate: "2026-09-17",
      items: [{ description: "Consulting", amount: 500 }],
      idempotencyKey: testIdempotencyKey,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.projectId).toBeNull();
    }
  });
});

describe("P1.1 — createInvoice domain service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates invoice successfully without project", async () => {
    vi.mocked(ClientModel.findOne).mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: "client-1", workspaceId: "ws-1" }),
    } as any);

    vi.mocked(InvoiceModel.countDocuments).mockResolvedValue(0);
    vi.mocked(InvoiceModel.create).mockResolvedValue({
      toObject: () => ({
        _id: "inv-1",
        workspaceId: "ws-1",
        clientId: "client-1",
        projectId: null,
        invoiceNumber: "INV-2026-0001",
      }),
    } as any);

    const result = await createInvoice({
      workspaceId: "ws-1",
      clientId: "client-1",
      issueDate: new Date("2026-09-17"),
      dueDate: null,
      notes: "",
      items: [{ description: "Service", amount: 100 }],
      idempotencyKey: testIdempotencyKey,
    });

    expect(result.projectId).toBeNull();
    expect(InvoiceModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: "ws-1",
        clientId: "client-1",
        projectId: null,
      }),
    );
  });

  it("creates invoice successfully when linked project matches client and workspace", async () => {
    vi.mocked(ClientModel.findOne).mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: "client-1", workspaceId: "ws-1" }),
    } as any);

    vi.mocked(ProjectModel.findOne).mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: "project-1",
        workspaceId: "ws-1",
        clientId: "client-1",
        isArchived: false,
      }),
    } as any);

    vi.mocked(InvoiceModel.countDocuments).mockResolvedValue(2);
    vi.mocked(InvoiceModel.create).mockResolvedValue({
      toObject: () => ({
        _id: "inv-2",
        workspaceId: "ws-1",
        clientId: "client-1",
        projectId: "project-1",
        invoiceNumber: "INV-2026-0003",
      }),
    } as any);

    const result = await createInvoice({
      workspaceId: "ws-1",
      clientId: "client-1",
      projectId: "project-1",
      issueDate: new Date("2026-09-17"),
      dueDate: null,
      notes: "",
      items: [{ description: "Web Dev", amount: 1500 }],
      idempotencyKey: testIdempotencyKey,
    });

    expect(result.projectId).toBe("project-1");
    expect(ProjectModel.findOne).toHaveBeenCalledWith({
      _id: "project-1",
      workspaceId: "ws-1",
      clientId: "client-1",
      isArchived: false,
    });
    expect(InvoiceModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "project-1",
      }),
    );
  });

  it("throws projectNotFoundShort when project does not exist or belongs to another client/workspace", async () => {
    vi.mocked(ClientModel.findOne).mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: "client-1", workspaceId: "ws-1" }),
    } as any);

    vi.mocked(ProjectModel.findOne).mockReturnValue({
      lean: vi.fn().mockResolvedValue(null),
    } as any);

    await expect(
      createInvoice({
        workspaceId: "ws-1",
        clientId: "client-1",
        projectId: "project-other-client",
        issueDate: new Date("2026-09-17"),
        dueDate: null,
        notes: "",
        items: [{ description: "Design", amount: 200 }],
        idempotencyKey: testIdempotencyKey,
      }),
    ).rejects.toThrow(InvalidInvoiceReferenceError);

    try {
      await createInvoice({
        workspaceId: "ws-1",
        clientId: "client-1",
        projectId: "project-other-client",
        issueDate: new Date("2026-09-17"),
        dueDate: null,
        notes: "",
        items: [{ description: "Design", amount: 200 }],
        idempotencyKey: testIdempotencyKey,
      });
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidInvoiceReferenceError);
      expect((err as InvalidInvoiceReferenceError).code).toBe("projectNotFoundShort");
    }

    expect(InvoiceModel.create).not.toHaveBeenCalled();
  });
});
