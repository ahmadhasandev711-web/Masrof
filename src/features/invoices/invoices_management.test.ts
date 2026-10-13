import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

import {
  cancelInvoice,
  archiveInvoice,
  updateInvoice,
  InvalidInvoiceReferenceError,
} from "@/features/invoices/data";
import { updateInvoiceSchema, invoiceFiltersSchema } from "@/features/invoices/schemas";
import { ClientModel } from "@/models/client";
import { ProjectModel } from "@/models/project";
import { InvoiceModel } from "@/models/invoice";
import { InvoicePaymentModel } from "@/models/invoice-payment";

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
    findOne: vi.fn(),
    find: vi.fn(),
  },
}));

vi.mock("@/models/invoice-payment", () => ({
  InvoicePaymentModel: {
    exists: vi.fn(),
    aggregate: vi.fn(),
  },
}));

describe("Invoices Management — Cancel, Archive, Update & Filters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Schemas", () => {
    const tValidation = (key: string) => key;
    const updateSchema = updateInvoiceSchema(tValidation as any);

    it("validates updateInvoiceSchema properly", () => {
      const valid = updateSchema.safeParse({
        invoiceId: "inv-1",
        workspaceId: "ws-1",
        clientId: "client-1",
        issueDate: "2026-10-13",
        items: [{ description: "Dev work", amount: 1500 }],
      });
      expect(valid.success).toBe(true);

      const invalid = updateSchema.safeParse({
        invoiceId: "",
        workspaceId: "ws-1",
        clientId: "",
        issueDate: "invalid-date",
        items: [],
      });
      expect(invalid.success).toBe(false);
    });

    it("parses invoiceFiltersSchema defaults", () => {
      const parsed = invoiceFiltersSchema.parse({
        workspaceId: "ws-1",
      });
      expect(parsed.page).toBe(1);
      expect(parsed.pageSize).toBe(20);
    });
  });

  describe("cancelInvoice", () => {
    it("throws cannotCancelWithRecordedPayments if invoice has payments", async () => {
      (InvoiceModel.findOne as any).mockResolvedValue({
        _id: "inv-1",
        workspaceId: "ws-1",
        status: "sent",
        save: vi.fn(),
      });
      (InvoicePaymentModel.exists as any).mockResolvedValue(true);

      await expect(cancelInvoice("inv-1", "ws-1")).rejects.toThrow(InvalidInvoiceReferenceError);
      await expect(cancelInvoice("inv-1", "ws-1")).rejects.toMatchObject({
        code: "cannotCancelWithRecordedPayments",
      });
    });

    it("cancels invoice successfully if no payments exist", async () => {
      const saveMock = vi.fn().mockResolvedValue(undefined);
      const mockDoc = {
        _id: "inv-1",
        workspaceId: "ws-1",
        status: "sent",
        paidAt: null,
        save: saveMock,
        toObject: () => ({ _id: "inv-1", status: "cancelled" }),
      };
      (InvoiceModel.findOne as any).mockResolvedValue(mockDoc);
      (InvoicePaymentModel.exists as any).mockResolvedValue(false);

      const result = await cancelInvoice("inv-1", "ws-1");
      expect(mockDoc.status).toBe("cancelled");
      expect(saveMock).toHaveBeenCalled();
    });
  });

  describe("archiveInvoice", () => {
    it("throws cannotArchiveWithRecordedPayments if invoice has payments", async () => {
      (InvoiceModel.findOne as any).mockResolvedValue({
        _id: "inv-1",
        workspaceId: "ws-1",
        isArchived: false,
        save: vi.fn(),
      });
      (InvoicePaymentModel.exists as any).mockResolvedValue(true);

      await expect(archiveInvoice("inv-1", "ws-1")).rejects.toThrow(InvalidInvoiceReferenceError);
      await expect(archiveInvoice("inv-1", "ws-1")).rejects.toMatchObject({
        code: "cannotArchiveWithRecordedPayments",
      });
    });

    it("archives invoice successfully if no payments exist", async () => {
      const saveMock = vi.fn().mockResolvedValue(undefined);
      const mockDoc = {
        _id: "inv-1",
        workspaceId: "ws-1",
        isArchived: false,
        save: saveMock,
        toObject: () => ({ _id: "inv-1", isArchived: true }),
      };
      (InvoiceModel.findOne as any).mockResolvedValue(mockDoc);
      (InvoicePaymentModel.exists as any).mockResolvedValue(false);

      await archiveInvoice("inv-1", "ws-1");
      expect(mockDoc.isArchived).toBe(true);
      expect(saveMock).toHaveBeenCalled();
    });
  });

  describe("updateInvoice", () => {
    const validWsId = "507f1f77bcf86cd799439011";
    const validInvId = "507f1f77bcf86cd799439012";
    const validClientId = "507f1f77bcf86cd799439013";

    it("throws totalLessThanPaid if new items sum is less than paidAmount", async () => {
      (ClientModel.findOne as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: validClientId, name: "Client A" }),
      });
      (InvoiceModel.findOne as any).mockResolvedValue({
        _id: validInvId,
        workspaceId: validWsId,
      });
      (InvoicePaymentModel.aggregate as any).mockResolvedValue([{ sum: 20000 }]); // 200 EGP

      await expect(
        updateInvoice({
          workspaceId: validWsId,
          invoiceId: validInvId,
          clientId: validClientId,
          issueDate: new Date("2026-10-10"),
          notes: "",
          items: [{ description: "Item 1", amount: 100 }], // 100 EGP = 10000 minor units (< 20000)
        })
      ).rejects.toMatchObject({
        code: "totalLessThanPaid",
      });
    });

    it("updates invoice items, dates and notes successfully", async () => {
      (ClientModel.findOne as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue({ _id: validClientId, name: "Client A" }),
      });
      const saveMock = vi.fn().mockResolvedValue(undefined);
      const mockInvoiceDoc = {
        _id: validInvId,
        workspaceId: validWsId,
        items: [],
        status: "cancelled",
        notes: "",
        save: saveMock,
        toObject: () => ({ _id: validInvId }),
      };
      (InvoiceModel.findOne as any).mockResolvedValue(mockInvoiceDoc);
      (InvoicePaymentModel.aggregate as any).mockResolvedValue([]);

      await updateInvoice({
        workspaceId: validWsId,
        invoiceId: validInvId,
        clientId: validClientId,
        issueDate: new Date("2026-10-10"),
        notes: "Updated note",
        items: [{ description: "Design", amount: 500 }],
      });

      expect(mockInvoiceDoc.items).toEqual([{ description: "Design", amount: 50000 }]);
      expect(mockInvoiceDoc.status).toBe("sent"); // Uncancels if previously cancelled
      expect(mockInvoiceDoc.notes).toBe("Updated note");
      expect(saveMock).toHaveBeenCalled();
    });
  });
});
