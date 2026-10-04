import type { InvoiceStatus } from "@/models/invoice";
import type { InvoiceDisplayStatus } from "@/features/invoices/status";

export type InvoiceLineItem = {
  description: string;
  amount: number;
};

export type InvoiceFinancialStatus = "unpaid" | "partially_paid" | "paid" | "legacy_paid";

export type InvoiceListItem = {
  _id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string | null;
  total: number;
  paidAmount: number;
  remainingAmount: number;
  clientName: string;
  clientId: string;
  projectId?: string | null;
  projectName?: string | null;
  status: InvoiceStatus;
  displayStatus: InvoiceDisplayStatus;
  financialStatus: InvoiceFinancialStatus;
  paidAt: string | null;
  clientPhone?: string | null;
  shareToken?: string | null;
  isShareable?: boolean;
  viewedAt?: string | null;
};

export type PublicInvoiceView = {
  id: string;
  shareToken: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string | null;
  items: InvoiceLineItem[];
  total: number;
  paidAmount: number;
  remainingAmount: number;
  notes: string;
  status: InvoiceStatus;
  financialStatus: InvoiceFinancialStatus;
  client: {
    name: string;
    email: string | null;
    phone: string | null;
  };
  projectName: string | null;
  workspaceName: string;
  businessName: string;
  logoUrl: string | null;
  taxId: string | null;
  businessPhone: string | null;
  businessAddress: string | null;
  currency: string;
  viewedAt: string | null;
};

export type InvoicePrintView = {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string | null;
  items: InvoiceLineItem[];
  total: number;
  notes: string;
  status: InvoiceStatus;
  client: {
    name: string;
    email: string | null;
    phone: string | null;
  };
  projectId?: string | null;
  projectName?: string | null;
  workspaceName: string;
  businessName: string;
  logoUrl: string | null;
  taxId: string | null;
  businessPhone: string | null;
  businessAddress: string | null;
  currency: string;
};

export type { PaymentMethod } from "@/models/invoice-payment";

export type InvoicePaymentListItem = {
  _id: string;
  invoiceId: string;
  transactionId: string;
  accountId: string;
  accountName?: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  reference: string;
  notes: string;
  createdAt: string;
};

export type InvoiceFinancialSummary = {
  invoiceTotal: number;
  paidTotal: number;
  remainingTotal: number;
  financialStatus: "unpaid" | "partially_paid" | "paid" | "legacy_paid";
};
