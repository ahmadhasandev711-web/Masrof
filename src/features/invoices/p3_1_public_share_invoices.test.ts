import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

import mongoose from "mongoose";
import {
  generateSecureShareToken,
  getOrCreateInvoiceShareToken,
  regenerateInvoiceShareToken,
  toggleInvoiceShareable,
  getPublicInvoiceByToken,
} from "@/features/invoices/public-invoice-data";
import { invoiceShareWhatsAppMessage } from "@/features/whatsapp/messages";
import { InvoiceModel } from "@/models/invoice";
import { InvoicePaymentModel } from "@/models/invoice-payment";

vi.mock("@/lib/db/mongoose", () => ({
  connectToDatabase: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/models/invoice", () => ({
  InvoiceModel: {
    findOne: vi.fn(),
    updateOne: vi.fn(),
  },
}));

vi.mock("@/models/invoice-payment", () => ({
  InvoicePaymentModel: {
    find: vi.fn(),
  },
}));

describe("Phase 3 — Public Invoice Sharing & Tracking", () => {
  const validInvoiceId = new mongoose.Types.ObjectId().toString();
  const validWorkspaceId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateSecureShareToken", () => {
    it("generates a 32-character hexadecimal token", () => {
      const token1 = generateSecureShareToken();
      const token2 = generateSecureShareToken();

      expect(typeof token1).toBe("string");
      expect(token1).toHaveLength(32);
      expect(/^[0-9a-f]{32}$/.test(token1)).toBe(true);
      expect(token1).not.toBe(token2);
    });
  });

  describe("getOrCreateInvoiceShareToken", () => {
    it("returns null for invalid ObjectIds", async () => {
      const token = await getOrCreateInvoiceShareToken("invalid-id", validWorkspaceId);
      expect(token).toBeNull();
    });

    it("returns existing shareToken if already generated", async () => {
      const mockInvoice = {
        _id: validInvoiceId,
        shareToken: "existingtoken1234567890abcdef",
        isShareable: true,
        save: vi.fn(),
      };
      (InvoiceModel.findOne as any).mockResolvedValue(mockInvoice);

      const token = await getOrCreateInvoiceShareToken(validInvoiceId, validWorkspaceId);

      expect(token).toBe("existingtoken1234567890abcdef");
      expect(mockInvoice.save).not.toHaveBeenCalled();
    });

    it("generates, saves and returns a new token if none exists", async () => {
      const mockInvoice = {
        _id: validInvoiceId,
        shareToken: null,
        isShareable: false,
        save: vi.fn().mockResolvedValue(true),
      };
      (InvoiceModel.findOne as any).mockResolvedValue(mockInvoice);

      const token = await getOrCreateInvoiceShareToken(validInvoiceId, validWorkspaceId);

      expect(token).toBeDefined();
      expect(token).toHaveLength(32);
      expect(mockInvoice.shareToken).toBe(token);
      expect(mockInvoice.isShareable).toBe(true);
      expect(mockInvoice.save).toHaveBeenCalledTimes(1);
    });

    it("returns null if invoice is not found", async () => {
      (InvoiceModel.findOne as any).mockResolvedValue(null);

      const token = await getOrCreateInvoiceShareToken(validInvoiceId, validWorkspaceId);
      expect(token).toBeNull();
    });
  });

  describe("regenerateInvoiceShareToken", () => {
    it("replaces existing token, resets viewedAt, and persists changes", async () => {
      const mockInvoice = {
        _id: validInvoiceId,
        shareToken: "oldtoken1234567890abcdef123456",
        viewedAt: new Date(),
        isShareable: true,
        save: vi.fn().mockResolvedValue(true),
      };
      (InvoiceModel.findOne as any).mockResolvedValue(mockInvoice);

      const newToken = await regenerateInvoiceShareToken(validInvoiceId, validWorkspaceId);

      expect(newToken).toBeDefined();
      expect(newToken).not.toBe("oldtoken1234567890abcdef123456");
      expect(mockInvoice.shareToken).toBe(newToken);
      expect(mockInvoice.viewedAt).toBeNull();
      expect(mockInvoice.save).toHaveBeenCalledTimes(1);
    });
  });

  describe("toggleInvoiceShareable", () => {
    it("updates isShareable flag in database", async () => {
      (InvoiceModel.updateOne as any).mockResolvedValue({ modifiedCount: 1 });

      const success = await toggleInvoiceShareable(validInvoiceId, validWorkspaceId, false);

      expect(success).toBe(true);
      expect(InvoiceModel.updateOne).toHaveBeenCalledWith(
        { _id: validInvoiceId, workspaceId: validWorkspaceId, isArchived: false },
        { $set: { isShareable: false } },
      );
    });
  });

  describe("getPublicInvoiceByToken", () => {
    it("returns null for invalid or short token", async () => {
      const result = await getPublicInvoiceByToken("short");
      expect(result).toBeNull();
    });

    it("returns sanitized public invoice data and calculates remaining balance correctly", async () => {
      const mockInvoiceData = {
        _id: validInvoiceId,
        shareToken: "valid_public_token_12345678901234",
        invoiceNumber: "INV-2026-0001",
        issueDate: new Date("2026-09-01"),
        dueDate: new Date("2026-09-30"),
        status: "sent",
        items: [
          { description: "UI Design", amount: 100000 },
          { description: "Frontend Development", amount: 150000 },
        ],
        notes: "Net 30 payment terms",
        viewedAt: null,
        clientId: {
          name: "Acme Corp",
          email: "billing@acme.com",
          phone: "+201012345678",
        },
        projectId: {
          name: "Design System Revamp",
        },
        workspaceId: {
          name: "Workspace Alpha",
          businessName: "Alpha Studios Ltd.",
          currency: "USD",
          businessPhone: "+201098765432",
          businessAddress: "Cairo, Egypt",
        },
      };

      const populateChain = {
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockInvoiceData),
      };
      (InvoiceModel.findOne as any).mockReturnValue(populateChain);

      // 100,000 paid out of 250,000 total
      const mockPayments = [
        { _id: "pay-1", amount: 100000, isArchived: false },
      ];
      (InvoicePaymentModel.find as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockPayments),
      });

      const updateExecMock = vi.fn().mockResolvedValue({});
      (InvoiceModel.updateOne as any).mockReturnValue({
        exec: vi.fn().mockReturnValue({ catch: vi.fn() }),
      });

      const publicInvoice = await getPublicInvoiceByToken("valid_public_token_12345678901234");

      expect(publicInvoice).not.toBeNull();
      if (!publicInvoice) return;

      expect(publicInvoice.invoiceNumber).toBe("INV-2026-0001");
      expect(publicInvoice.total).toBe(250000);
      expect(publicInvoice.paidAmount).toBe(100000);
      expect(publicInvoice.remainingAmount).toBe(150000);
      expect(publicInvoice.financialStatus).toBe("partially_paid");
      expect(publicInvoice.client.name).toBe("Acme Corp");
      expect(publicInvoice.projectName).toBe("Design System Revamp");
      expect(publicInvoice.businessName).toBe("Alpha Studios Ltd.");
      expect(publicInvoice.currency).toBe("USD");

      // Verify viewedAt update was triggered
      expect(InvoiceModel.updateOne).toHaveBeenCalledWith(
        { _id: validInvoiceId, viewedAt: null },
        expect.objectContaining({ $set: { viewedAt: expect.any(Date) } }),
      );
    });

    it("evaluates financialStatus as paid when fully settled", async () => {
      const mockInvoiceData = {
        _id: validInvoiceId,
        shareToken: "valid_public_token_12345678901234",
        invoiceNumber: "INV-2026-0002",
        issueDate: new Date("2026-09-01"),
        status: "sent",
        items: [{ description: "Consulting", amount: 50000 }],
        viewedAt: new Date("2026-09-02"),
        clientId: { name: "Client Beta" },
        workspaceId: { name: "Studio" },
      };

      (InvoiceModel.findOne as any).mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        lean: vi.fn().mockResolvedValue(mockInvoiceData),
      });

      (InvoicePaymentModel.find as any).mockReturnValue({
        lean: vi.fn().mockResolvedValue([{ amount: 50000 }]),
      });

      const publicInvoice = await getPublicInvoiceByToken("valid_public_token_12345678901234");

      expect(publicInvoice).not.toBeNull();
      expect(publicInvoice?.financialStatus).toBe("paid");
      expect(publicInvoice?.remainingAmount).toBe(0);
    });
  });

  describe("invoiceShareWhatsAppMessage", () => {
    const mockT = (key: string, values?: Record<string, string | number>) => {
      switch (key) {
        case "invoiceShare.greeting":
          return `مرحباً ${values?.name}،`;
        case "invoiceShare.body":
          return `نرسل لك تفاصيل الفاتورة رقم ${values?.invoice} من ${values?.workspace}.`;
        case "invoiceShare.amount":
          return `المبلغ المستحق: ${values?.amount}`;
        case "invoiceShare.dueDate":
          return `تاريخ الاستحقاق: ${values?.date}`;
        case "invoiceShare.viewLink":
          return `يمكنك استعراض الفاتورة والتحميل مباشرة عبر الرابط:\n${values?.url}`;
        case "invoiceShare.thanks":
          return "شكراً لتعاملكم معنا!";
        default:
          return key;
      }
    };

    it("formats a complete WhatsApp message with due date and share URL", () => {
      const message = invoiceShareWhatsAppMessage(mockT, {
        clientName: "أحمد",
        invoiceNumber: "INV-001",
        remainingLabel: "5,000 ج.م",
        dueDateLabel: "15 أكتوبر 2026",
        workspaceName: "استوديو الإبداع",
        shareUrl: "https://masrofaty.app/i/abcdef1234567890",
      });

      expect(message).toContain("مرحباً أحمد،");
      expect(message).toContain("الفاتورة رقم INV-001");
      expect(message).toContain("استوديو الإبداع");
      expect(message).toContain("5,000 ج.م");
      expect(message).toContain("15 أكتوبر 2026");
      expect(message).toContain("https://masrofaty.app/i/abcdef1234567890");
      expect(message).toContain("شكراً لتعاملكم معنا!");
    });

    it("omits due date line when dueDateLabel is null", () => {
      const message = invoiceShareWhatsAppMessage(mockT, {
        clientName: "شركة النور",
        invoiceNumber: "INV-002",
        remainingLabel: "$1,200",
        dueDateLabel: null,
        workspaceName: "My Agency",
        shareUrl: "https://masrofaty.app/i/token999",
      });

      expect(message).not.toContain("تاريخ الاستحقاق");
      expect(message).toContain("$1,200");
    });
  });
});
