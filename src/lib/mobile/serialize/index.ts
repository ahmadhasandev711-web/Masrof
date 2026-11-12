import "server-only";

import { asId, asIsoDate } from "@contracts/mobile/common";
import type { MobileClient } from "@contracts/mobile/clients";
import type { MobileProject } from "@contracts/mobile/projects";
import type { MobileAccount } from "@contracts/mobile/accounts";
import type { MobileCategory } from "@contracts/mobile/categories";
import type { MobileTransaction } from "@contracts/mobile/transactions";
import type { MobileBudget } from "@contracts/mobile/budgets";
import type { MobileGoal } from "@contracts/mobile/goals";
import type { MobileWorkspace, MobileBranding } from "@contracts/mobile/workspaces";
import type { MobileInvoice, MobileInvoiceTemplate } from "@contracts/mobile/invoices";
import { populatedName, serializeId } from "@/lib/mobile/session";

export function toMobileWorkspace(item: {
  id: string;
  name: string;
  type: string;
  currency: string;
  businessName: string | null;
  role: MobileWorkspace["role"];
}): MobileWorkspace {
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    currency: item.currency,
    businessName: item.businessName,
    role: item.role,
  };
}

export function toMobileBranding(input: {
  businessName?: string | null;
  logoUrl?: string | null;
  taxId?: string | null;
  businessPhone?: string | null;
  businessAddress?: string | null;
}): MobileBranding {
  return {
    businessName: input.businessName ?? null,
    logoUrl: input.logoUrl ?? null,
    taxId: input.taxId ?? null,
    businessPhone: input.businessPhone ?? null,
    businessAddress: input.businessAddress ?? null,
  };
}

export function toMobileClient(item: Record<string, unknown>): MobileClient {
  return {
    id: asId(item._id ?? item.id),
    name: String(item.name ?? ""),
    email: (item.email as string | null | undefined) ?? null,
    phone: (item.phone as string | null | undefined) ?? null,
    projectCount: typeof item.projectCount === "number" ? item.projectCount : undefined,
    invoicedTotal: typeof item.invoicedTotal === "number" ? item.invoicedTotal : undefined,
    paidTotal: typeof item.paidTotal === "number" ? item.paidTotal : undefined,
    outstandingBalance:
      typeof item.outstandingBalance === "number" ? item.outstandingBalance : undefined,
  };
}

export function toMobileProject(item: Record<string, unknown>): MobileProject {
  return {
    id: asId(item._id ?? item.id),
    name: String(item.name ?? ""),
    status: String(item.status ?? ""),
    expectedAmount:
      item.expectedAmount == null ? null : Number(item.expectedAmount),
    dueDate: asIsoDate(item.dueDate),
    clientId: item.clientId == null ? null : asId(item.clientId),
    clientName: (item.clientName as string | null | undefined) ?? null,
    clientPhone: (item.clientPhone as string | null | undefined) ?? null,
    paidTotal: typeof item.paidTotal === "number" ? item.paidTotal : undefined,
    incomeTotal: typeof item.incomeTotal === "number" ? item.incomeTotal : undefined,
    expenseTotal: typeof item.expenseTotal === "number" ? item.expenseTotal : undefined,
    netProfit: typeof item.netProfit === "number" ? item.netProfit : undefined,
    profitMargin:
      item.profitMargin == null ? null : Number(item.profitMargin),
    invoicedTotal: typeof item.invoicedTotal === "number" ? item.invoicedTotal : undefined,
    isOverBudget: typeof item.isOverBudget === "boolean" ? item.isOverBudget : undefined,
  };
}

export function toMobileAccount(item: {
  _id?: unknown;
  id?: unknown;
  name: string;
  type: string;
  currency?: string | null;
  cachedBalance?: number;
  balance?: number;
}): MobileAccount {
  return {
    id: asId(item._id ?? item.id),
    name: item.name,
    type: item.type,
    currency: item.currency ?? null,
    balance: item.cachedBalance ?? item.balance ?? 0,
  };
}

export function toMobileCategory(item: {
  _id?: unknown;
  id?: unknown;
  name: string;
  nameEn?: string | null;
  displayName?: string;
  slug?: string | null;
  kind: "income" | "expense";
  icon?: string | null;
  isSystem?: boolean;
}): MobileCategory {
  return {
    id: asId(item._id ?? item.id),
    name: item.name,
    nameEn: item.nameEn ?? null,
    displayName: item.displayName,
    slug: item.slug ?? null,
    kind: item.kind,
    icon: item.icon ?? null,
    isSystem: Boolean(item.isSystem),
  };
}

export function toMobileTransaction(item: Record<string, unknown>): MobileTransaction {
  return {
    id: serializeId(item._id ?? item.id),
    type: String(item.type ?? ""),
    amount: Number(item.amount ?? 0),
    transactionDate: asIsoDate(item.transactionDate) ?? new Date().toISOString(),
    description: String(item.description ?? ""),
    notes: String(item.notes ?? ""),
    accountId: serializeId(item.accountId),
    accountName: populatedName(item.accountId),
    categoryId: serializeId(item.categoryId),
    categoryName: populatedName(item.categoryId),
    clientId: item.clientId ? serializeId(item.clientId) : null,
    clientName: populatedName(item.clientId),
    projectId: item.projectId ? serializeId(item.projectId) : null,
    projectName: populatedName(item.projectId),
  };
}

export function toMobileInvoice(item: Record<string, unknown>): MobileInvoice {
  const rawItems = Array.isArray(item.items) ? item.items : undefined;
  const items = rawItems?.map((raw) => {
    const line = raw as Record<string, unknown>;
    const amount = Number(line.amount ?? 0);
    const quantity =
      typeof line.quantity === "number" && line.quantity > 0 ? line.quantity : 1;
    const unitPrice =
      typeof line.unitPrice === "number" && line.unitPrice > 0
        ? line.unitPrice
        : amount;
    return {
      description: String(line.description ?? ""),
      quantity,
      unitPrice,
      amount,
    };
  });

  return {
    id: asId(item._id ?? item.id),
    invoiceNumber: String(item.invoiceNumber ?? ""),
    issueDate: asIsoDate(item.issueDate) ?? "",
    dueDate: asIsoDate(item.dueDate),
    items,
    subtotal: typeof item.subtotal === "number" ? item.subtotal : undefined,
    taxEnabled: typeof item.taxEnabled === "boolean" ? item.taxEnabled : undefined,
    taxRatePercent:
      typeof item.taxRatePercent === "number" ? item.taxRatePercent : undefined,
    taxAmount: typeof item.taxAmount === "number" ? item.taxAmount : undefined,
    total: Number(item.total ?? 0),
    paidAmount: typeof item.paidAmount === "number" ? item.paidAmount : undefined,
    remainingAmount:
      typeof item.remainingAmount === "number" ? item.remainingAmount : undefined,
    clientName: item.clientName != null ? String(item.clientName) : undefined,
    clientId: item.clientId != null ? asId(item.clientId) : undefined,
    status: item.status != null ? String(item.status) : undefined,
    financialStatus:
      item.financialStatus != null ? String(item.financialStatus) : undefined,
    projectId: item.projectId == null ? null : asId(item.projectId),
    projectName: (item.projectName as string | null | undefined) ?? null,
  };
}

export function toMobileInvoiceTemplate(
  item: Record<string, unknown>,
): MobileInvoiceTemplate {
  const rawItems = Array.isArray(item.items) ? item.items : [];
  return {
    id: asId(item._id ?? item.id),
    name: String(item.name ?? ""),
    items: rawItems.map((raw) => {
      const line = raw as Record<string, unknown>;
      const amount = Number(line.amount ?? 0);
      const quantity =
        typeof line.quantity === "number" && line.quantity > 0 ? line.quantity : 1;
      const unitPrice =
        typeof line.unitPrice === "number" && line.unitPrice > 0
          ? line.unitPrice
          : amount;
      return {
        description: String(line.description ?? ""),
        quantity,
        unitPrice,
        amount,
      };
    }),
    taxEnabled: Boolean(item.taxEnabled),
    taxRatePercent: Number(item.taxRatePercent ?? 0),
    sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : undefined,
  };
}

export function toMobileBudget(item: Record<string, unknown>): MobileBudget {
  return {
    id: asId(item._id ?? item.id),
    name: String(item.name ?? ""),
    amount: Number(item.amount ?? 0),
    spent: Number(item.spent ?? 0),
    remaining: Number(item.remaining ?? 0),
    percentage: Number(item.percentage ?? 0),
    categoryId: item.categoryId ? asId(item.categoryId) : null,
  };
}

export function toMobileGoal(item: Record<string, unknown>): MobileGoal {
  return {
    id: asId(item._id ?? item.id),
    name: String(item.name ?? ""),
    targetAmount: Number(item.targetAmount ?? 0),
    currentAmount: Number(item.currentAmount ?? 0),
    remaining: Number(item.remaining ?? 0),
    percentage: Number(item.percentage ?? 0),
    deadline: asIsoDate(item.deadline),
  };
}

export function toMobileRecurring(item: Record<string, unknown>) {
  const { _id, ...rest } = item;
  return {
    id: asId(_id ?? item.id),
    ...rest,
  };
}

export function toMobileDebt(item: Record<string, unknown>) {
  const { _id, ...rest } = item;
  return {
    id: asId(_id ?? item.id),
    ...rest,
  };
}

export function toMobileTransfer(item: Record<string, unknown>) {
  return {
    id: asId(item._id ?? item.id),
    amount: Number(item.amount ?? 0),
    transferDate: asIsoDate(item.transferDate) ?? undefined,
    fromAccountId: item.fromAccountId ? asId(item.fromAccountId) : undefined,
    toAccountId: item.toAccountId ? asId(item.toAccountId) : undefined,
    notes: item.notes != null ? String(item.notes) : undefined,
  };
}
