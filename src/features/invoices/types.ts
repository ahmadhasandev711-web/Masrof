import type { InvoiceStatus } from "@/models/invoice";
import type { InvoiceDisplayStatus } from "@/features/invoices/status";

export type InvoiceLineItem = {
  description: string;
  amount: number;
};

export type InvoiceListItem = {
  _id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string | null;
  total: number;
  clientName: string;
  clientId: string;
  status: InvoiceStatus;
  displayStatus: InvoiceDisplayStatus;
  paidAt: string | null;
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
  workspaceName: string;
  businessName: string;
  logoUrl: string | null;
  taxId: string | null;
  businessPhone: string | null;
  businessAddress: string | null;
  currency: string;
};
