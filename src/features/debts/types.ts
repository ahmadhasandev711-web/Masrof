export type DebtStatus = "active" | "paid";

export type DebtItem = {
  id: string;
  workspaceId: string;
  name: string;
  creditor: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  progressPercent: number;
  currency: string;
  dueDate: string | null;
  status: DebtStatus;
  category: string;
  notes: string;
  createdAt: string;
};

export type DebtSummary = {
  totalLiabilities: number;
  totalPaid: number;
  remainingLiabilities: number;
  activeCount: number;
  paidCount: number;
  currency: string;
};

export type DebtPaymentItem = {
  id: string;
  workspaceId: string;
  debtId: string;
  amount: number;
  paymentDate: string;
  accountId: string;
  accountName: string;
  transactionId: string;
  reference: string;
  notes: string;
  createdAt: string;
};
