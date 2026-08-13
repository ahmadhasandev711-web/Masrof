import type { InvoiceStatus } from "@/models/invoice";

export type InvoiceDisplayStatus = InvoiceStatus | "overdue";

export function resolveInvoiceDisplayStatus(input: {
  status: InvoiceStatus | string | null | undefined;
  dueDate: Date | string | null | undefined;
  now?: Date;
}): InvoiceDisplayStatus {
  const status = (input.status ?? "sent") as InvoiceStatus;
  if (status === "paid" || status === "cancelled" || status === "draft") {
    return status;
  }

  if (!input.dueDate) return "sent";

  const due = input.dueDate instanceof Date ? input.dueDate : new Date(input.dueDate);
  const now = input.now ?? new Date();
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (dueDay.getTime() < today.getTime()) {
    return "overdue";
  }

  return "sent";
}
