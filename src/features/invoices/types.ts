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
};

export type InvoicePrintView = {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string | null;
  items: InvoiceLineItem[];
  total: number;
  notes: string;
  client: {
    name: string;
    email: string | null;
    phone: string | null;
  };
  workspaceName: string;
  currency: string;
};
