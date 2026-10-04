import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

import { recordPaymentSchema } from "@/features/invoices/payment-schemas";
import {
  recordInvoicePayment,
  getInvoiceFinancialSummary,
  InvoiceOverpaymentError,
  InvoiceCancelledError,
  AccountCurrencyMismatchError,
} from "@/features/invoices/payment-data";
import { InvoiceModel } from "@/models/invoice";
import { InvoicePaymentModel } from "@/models/invoice-payment";
import { TransactionModel } from "@/models/transaction";
import { AccountModel } from "@/models/account";
import { CategoryModel } from "@/models/category";
import { WorkspaceModel } from "@/models/workspace";

const mockSession = {
  withTransaction: vi.fn(async (cb: () => Promise<void>) => {
    await cb();
  }),
  endSession: vi.fn().mockResolvedValue(undefined),
};

vi.mock("@/lib/db/mongoose", () => ({
  connectToDatabase: vi.fn().mockResolvedValue({
    startSession: vi.fn(() => mockSession),
  }),
}));

vi.mock("@/models/invoice", () => ({
  InvoiceModel: {
    findOne: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  },
  INVOICE_STATUSES: ["draft", "sent", "paid", "cancelled"] as const,
}));

vi.mock("@/models/invoice-payment", () => ({
  InvoicePaymentModel: {
    find: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
  },
  PAYMENT_METHODS: ["cash", "bank_transfer", "card", "check", "other"] as const,
}));

vi.mock("@/models/transaction", () => ({
  TransactionModel: {
    create: vi.fn(),
  },
}));

vi.mock("@/models/account", () => ({
  AccountModel: {
    findOne: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  },
}));

vi.mock("@/models/category", () => ({
  CategoryModel: {
    findOne: vi.fn(),
  },
}));

vi.mock("@/models/workspace", () => ({
  WorkspaceModel: {
    findById: vi.fn(),
  },
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn) => fn),
}));

describe("P1.2 — recordPaymentSchema validation", () => {
  const t = (k: string) => k;
  const schema = recordPaymentSchema(t);

  it("accepts valid payment input", () => {
    const res = schema.safeParse({
      workspaceId: "ws-1",
      invoiceId: "inv-1",
      accountId: "acc-1",
      amount: 150.5,
      paymentDate: "2026-09-17",
      paymentMethod: "bank_transfer",
      reference: "TRX-987",
      idempotencyKey: "key-uuid-1",
    });
    expect(res.success).toBe(true);
  });

  it("rejects zero or negative amount", () => {
    const zeroRes = schema.safeParse({
      workspaceId: "ws-1",
      invoiceId: "inv-1",
      accountId: "acc-1",
      amount: 0,
      paymentDate: "2026-09-17",
      idempotencyKey: "key-uuid-1",
    });
    expect(zeroRes.success).toBe(false);

    const negRes = schema.safeParse({
      workspaceId: "ws-1",
      invoiceId: "inv-1",
      accountId: "acc-1",
      amount: -10,
      paymentDate: "2026-09-17",
      idempotencyKey: "key-uuid-1",
    });
    expect(negRes.success).toBe(false);
  });

  it("rejects missing idempotencyKey", () => {
    const res = schema.safeParse({
      workspaceId: "ws-1",
      invoiceId: "inv-1",
      accountId: "acc-1",
      amount: 100,
      paymentDate: "2026-09-17",
    });
    expect(res.success).toBe(false);
  });
});

describe("P1.3 — recordInvoicePayment atomic service", () => {
  const wsId = "ws-1";
  const invId = "inv-100";
  const accId = "acc-50";
  const catId = "cat-10";
  const userId = "usr-1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function setupStandardPreconditions(options?: {
    invoiceStatus?: string;
    accountCurrency?: string;
    invoiceItemsTotal?: number;
    existingPayments?: { amount: number }[];
  }) {
    const status = options?.invoiceStatus ?? "sent";
    const accountCurrency = options?.accountCurrency ?? "EGP";
    const total = options?.invoiceItemsTotal ?? 100000; // 1,000.00 EGP in minor units
    const existingPayments = options?.existingPayments ?? [];

    vi.mocked(WorkspaceModel.findById).mockReturnValue({
      lean: vi.fn().mockResolvedValue({ _id: wsId, currency: "EGP" }),
    } as any);

    vi.mocked(InvoiceModel.findOne).mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: invId,
        workspaceId: wsId,
        invoiceNumber: "INV-2026-0001",
        clientId: "client-1",
        projectId: "proj-1",
        status,
        items: [{ description: "Dev work", amount: total }],
      }),
    } as any);

    vi.mocked(AccountModel.findOne).mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: accId,
        workspaceId: wsId,
        currency: accountCurrency,
        cachedBalance: 50000,
      }),
    } as any);

    const leanCategory = vi.fn().mockResolvedValue({
      _id: catId,
      kind: "income",
      workspaceId: wsId,
    });
    vi.mocked(CategoryModel.findOne).mockReturnValue({
      sort: vi.fn().mockReturnValue({ lean: leanCategory }),
      lean: leanCategory,
    } as any);

    return { total, existingPayments };
  }

  it("rejects payments on cancelled invoices", async () => {
    setupStandardPreconditions({ invoiceStatus: "cancelled" });

    await expect(
      recordInvoicePayment(
        {
          workspaceId: wsId,
          invoiceId: invId,
          accountId: accId,
          amount: 500,
          paymentDate: new Date("2026-09-17"),
          paymentMethod: "bank_transfer",
          reference: "",
          notes: "",
          idempotencyKey: "key-1",
        },
        userId,
      ),
    ).rejects.toThrow(InvoiceCancelledError);
  });

  it("rejects payments when account currency does not match workspace currency", async () => {
    setupStandardPreconditions({ accountCurrency: "USD" }); // workspace is EGP

    await expect(
      recordInvoicePayment(
        {
          workspaceId: wsId,
          invoiceId: invId,
          accountId: accId,
          amount: 500,
          paymentDate: new Date("2026-09-17"),
          paymentMethod: "bank_transfer",
          reference: "",
          notes: "",
          idempotencyKey: "key-1",
        },
        userId,
      ),
    ).rejects.toThrow(AccountCurrencyMismatchError);
  });

  it("idempotency: returns existing payment without creating new transaction or incrementing balance", async () => {
    setupStandardPreconditions();

    const existingPaymentObj = {
      _id: "pay-existing",
      workspaceId: wsId,
      invoiceId: invId,
      amount: 50000,
      idempotencyKey: "idemp-key-repeat",
    };

    vi.mocked(InvoicePaymentModel.findOne).mockReturnValue({
      session: vi.fn().mockResolvedValue({
        toObject: () => existingPaymentObj,
      }),
    } as any);

    const result = await recordInvoicePayment(
      {
        workspaceId: wsId,
        invoiceId: invId,
        accountId: accId,
        amount: 500,
        paymentDate: new Date("2026-09-17"),
        paymentMethod: "bank_transfer",
        reference: "",
        notes: "",
        idempotencyKey: "idemp-key-repeat",
      },
      userId,
    );

    expect(result._id).toBe("pay-existing");
    expect(TransactionModel.create).not.toHaveBeenCalled();
    expect(AccountModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("overpayment protection: rejects payment greater than invoice remaining balance", async () => {
    // Total is 1,000.00 EGP (100,000 minor units). Existing paid is 80,000 minor units.
    setupStandardPreconditions({
      invoiceItemsTotal: 100000,
    });

    vi.mocked(InvoicePaymentModel.findOne).mockReturnValue({
      session: vi.fn().mockResolvedValue(null),
    } as any);

    vi.mocked(InvoicePaymentModel.find).mockReturnValue({
      session: vi.fn().mockResolvedValue([{ amount: 80000 }]),
    } as any);

    // Attempt to pay 300 EGP (30,000 minor units) when only 20,000 is remaining
    await expect(
      recordInvoicePayment(
        {
          workspaceId: wsId,
          invoiceId: invId,
          accountId: accId,
          amount: 300,
          paymentDate: new Date("2026-09-17"),
          paymentMethod: "bank_transfer",
          reference: "",
          notes: "",
          idempotencyKey: "key-overpay",
        },
        userId,
      ),
    ).rejects.toThrow(InvoiceOverpaymentError);

    expect(TransactionModel.create).not.toHaveBeenCalled();
    expect(AccountModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("successfully records partial payment, creates transaction, and increments balance", async () => {
    // Total 100,000 minor units (1000 EGP). Pay 400 EGP (40,000 minor units).
    setupStandardPreconditions({ invoiceItemsTotal: 100000 });

    vi.mocked(InvoicePaymentModel.findOne).mockReturnValue({
      session: vi.fn().mockResolvedValue(null),
    } as any);

    vi.mocked(InvoicePaymentModel.find).mockReturnValue({
      session: vi.fn().mockResolvedValue([]),
    } as any);

    const createdTxId = "tx-123";
    vi.mocked(TransactionModel.create).mockResolvedValue([
      { _id: createdTxId },
    ] as any);

    const createdPaymentObj = {
      _id: "pay-1",
      workspaceId: wsId,
      invoiceId: invId,
      transactionId: createdTxId,
      accountId: accId,
      amount: 40000,
      paymentDate: new Date("2026-09-17"),
      paymentMethod: "bank_transfer",
    };
    vi.mocked(InvoicePaymentModel.create).mockResolvedValue([
      { toObject: () => createdPaymentObj },
    ] as any);

    const result = await recordInvoicePayment(
      {
        workspaceId: wsId,
        invoiceId: invId,
        accountId: accId,
        amount: 400,
        paymentDate: new Date("2026-09-17"),
        paymentMethod: "bank_transfer",
        reference: "BANK-REF-1",
        notes: "First installment",
        idempotencyKey: "key-part-1",
      },
      userId,
    );

    expect(result._id).toBe("pay-1");

    // Verified: Cash transaction created with correct attributes
    expect(TransactionModel.create).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          workspaceId: wsId,
          accountId: accId,
          type: "income",
          amount: 40000,
          clientId: "client-1",
          projectId: "proj-1",
          createdBy: userId,
        }),
      ],
      expect.anything(),
    );

    // Verified: Account cached balance incremented
    expect(AccountModel.findByIdAndUpdate).toHaveBeenCalledWith(
      accId,
      { $inc: { cachedBalance: 40000 } },
      expect.anything(),
    );

    // Verified: Partial payment does not mark invoice paid
    expect(InvoiceModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it("marks invoice paid when payment settles full remaining amount", async () => {
    // Total 100,000 minor units. Existing 60,000 minor units. Paying remainder 400 EGP (40,000).
    setupStandardPreconditions({ invoiceItemsTotal: 100000 });

    vi.mocked(InvoicePaymentModel.findOne).mockReturnValue({
      session: vi.fn().mockResolvedValue(null),
    } as any);

    vi.mocked(InvoicePaymentModel.find).mockReturnValue({
      session: vi.fn().mockResolvedValue([{ amount: 60000 }]),
    } as any);

    vi.mocked(TransactionModel.create).mockResolvedValue([
      { _id: "tx-final" },
    ] as any);

    vi.mocked(InvoicePaymentModel.create).mockResolvedValue([
      { toObject: () => ({ _id: "pay-final", amount: 40000 }) },
    ] as any);

    await recordInvoicePayment(
      {
        workspaceId: wsId,
        invoiceId: invId,
        accountId: accId,
        amount: 400,
        paymentDate: new Date("2026-09-17"),
        paymentMethod: "card",
        reference: "",
        notes: "Final settlement",
        idempotencyKey: "key-final",
      },
      userId,
    );

    // Verified: Invoice status updated to paid and paidAt set
    expect(InvoiceModel.findByIdAndUpdate).toHaveBeenCalledWith(
      invId,
      expect.objectContaining({
        status: "paid",
        paidAt: expect.any(Date),
      }),
      expect.anything(),
    );
  });
});

describe("P1.2/P1.3 — getInvoiceFinancialSummary", () => {
  const wsId = "ws-1";
  const invId = "inv-100";

  it("calculates unpaid status correctly", async () => {
    vi.mocked(InvoiceModel.findOne).mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: invId,
        workspaceId: wsId,
        status: "sent",
        items: [{ amount: 50000 }],
      }),
    } as any);

    vi.mocked(InvoicePaymentModel.find).mockReturnValue({
      lean: vi.fn().mockResolvedValue([]),
    } as any);

    const summary = await getInvoiceFinancialSummary(invId, wsId);
    expect(summary).toEqual({
      invoiceTotal: 50000,
      paidTotal: 0,
      remainingTotal: 50000,
      financialStatus: "unpaid",
    });
  });

  it("calculates partially_paid status correctly", async () => {
    vi.mocked(InvoiceModel.findOne).mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: invId,
        workspaceId: wsId,
        status: "sent",
        items: [{ amount: 50000 }],
      }),
    } as any);

    vi.mocked(InvoicePaymentModel.find).mockReturnValue({
      lean: vi.fn().mockResolvedValue([{ amount: 20000 }]),
    } as any);

    const summary = await getInvoiceFinancialSummary(invId, wsId);
    expect(summary).toEqual({
      invoiceTotal: 50000,
      paidTotal: 20000,
      remainingTotal: 30000,
      financialStatus: "partially_paid",
    });
  });

  it("identifies legacy_paid when invoice was manually marked paid without payment records", async () => {
    vi.mocked(InvoiceModel.findOne).mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: invId,
        workspaceId: wsId,
        status: "paid",
        paidAt: new Date("2026-01-01"),
        items: [{ amount: 50000 }],
      }),
    } as any);

    vi.mocked(InvoicePaymentModel.find).mockReturnValue({
      lean: vi.fn().mockResolvedValue([]),
    } as any);

    const summary = await getInvoiceFinancialSummary(invId, wsId);
    expect(summary).toEqual({
      invoiceTotal: 50000,
      paidTotal: 0,
      remainingTotal: 50000,
      financialStatus: "legacy_paid",
    });
  });

  it("identifies paid when payments equal or exceed invoice total", async () => {
    vi.mocked(InvoiceModel.findOne).mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: invId,
        workspaceId: wsId,
        status: "paid",
        items: [{ amount: 50000 }],
      }),
    } as any);

    vi.mocked(InvoicePaymentModel.find).mockReturnValue({
      lean: vi.fn().mockResolvedValue([{ amount: 30000 }, { amount: 20000 }]),
    } as any);

    const summary = await getInvoiceFinancialSummary(invId, wsId);
    expect(summary).toEqual({
      invoiceTotal: 50000,
      paidTotal: 50000,
      remainingTotal: 0,
      financialStatus: "paid",
    });
  });
});
