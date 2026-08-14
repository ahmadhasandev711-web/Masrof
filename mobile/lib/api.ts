import { getAuthCookie } from "@/lib/auth-client";
import { API_URL } from "@/lib/config";

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

async function mobileFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const cookies = getAuthCookie();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(cookies ? { Cookie: cookies } : {}),
      ...init?.headers,
    },
    credentials: "omit",
  });

  if (!response.ok) {
    let code = "server-error";
    try {
      const data = (await response.json()) as { error?: string };
      code = data.error ?? code;
    } catch {
      /* ignore */
    }
    throw new ApiError(response.status, code);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export type MobileEntitlements = {
  user: { id: string; name: string; email: string };
  plan: "free" | "pro" | "plus";
  showAds: boolean;
  isSuspended: boolean;
};

export type WorkspaceItem = {
  id: string;
  name: string;
  type: string;
  currency: string;
  businessName: string | null;
};

export type DashboardSummary = {
  workspace: { id: string; name: string; currency: string };
  totalBalance: number;
  monthIncome: number;
  monthExpense: number;
  monthNet: number;
  budgetWarnings: number;
  dueRecurring: number;
  receivableProjects: number;
};

export type AccountItem = {
  id: string;
  name: string;
  type: string;
  currency: string;
  balance: number;
};

export type CategoryItem = {
  id: string;
  name: string;
  kind: "income" | "expense";
  icon: string | null;
  isSystem: boolean;
};

export type TransactionItem = {
  id: string;
  type: "income" | "expense";
  amount: number;
  transactionDate: string;
  description: string;
  accountName: string | null;
  categoryName: string | null;
  clientName: string | null;
};

export function fetchEntitlements() {
  return mobileFetch<MobileEntitlements>("/api/mobile/entitlements");
}

export function fetchWorkspaces() {
  return mobileFetch<{ items: WorkspaceItem[]; activeWorkspaceId: string | null }>(
    "/api/mobile/workspaces",
  );
}

export function fetchDashboard(workspaceId: string) {
  return mobileFetch<DashboardSummary>(
    `/api/mobile/dashboard?workspaceId=${encodeURIComponent(workspaceId)}`,
  );
}

export function fetchAccounts(workspaceId: string) {
  return mobileFetch<{ items: AccountItem[] }>(
    `/api/mobile/accounts?workspaceId=${encodeURIComponent(workspaceId)}`,
  );
}

export function createAccount(body: {
  workspaceId: string;
  name: string;
  type: string;
  openingBalance?: number;
}) {
  return mobileFetch<AccountItem>("/api/mobile/accounts", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function fetchCategories(workspaceId: string, kind?: "income" | "expense") {
  const qs = new URLSearchParams({ workspaceId });
  if (kind) qs.set("kind", kind);
  return mobileFetch<{ items: CategoryItem[] }>(`/api/mobile/categories?${qs}`);
}

export function createCategory(body: { workspaceId: string; name: string; kind: string }) {
  return mobileFetch("/api/mobile/categories", { method: "POST", body: JSON.stringify(body) });
}

export function fetchTransactions(workspaceId: string, page = 1) {
  const qs = new URLSearchParams({ workspaceId, page: String(page), pageSize: "30" });
  return mobileFetch<{
    items: TransactionItem[];
    total: number;
    page: number;
    totalPages: number;
  }>(`/api/mobile/transactions?${qs}`);
}

export function createTransaction(body: Record<string, unknown>) {
  return mobileFetch<{ id: string }>("/api/mobile/transactions", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function fetchClients(workspaceId: string) {
  return mobileFetch<{
    items: { _id: string; name: string; email: string | null; phone: string | null; projectCount: number }[];
  }>(`/api/mobile/clients?workspaceId=${encodeURIComponent(workspaceId)}`);
}

export function createClient(body: {
  workspaceId: string;
  name: string;
  email?: string;
  phone?: string;
}) {
  return mobileFetch("/api/mobile/clients", { method: "POST", body: JSON.stringify(body) });
}

export function fetchProjects(workspaceId: string) {
  return mobileFetch<{ items: Record<string, unknown>[] }>(
    `/api/mobile/projects?workspaceId=${encodeURIComponent(workspaceId)}`,
  );
}

export function createProject(body: Record<string, unknown>) {
  return mobileFetch("/api/mobile/projects", { method: "POST", body: JSON.stringify(body) });
}

export function fetchInvoices(workspaceId: string) {
  return mobileFetch<{
    items: {
      _id: string;
      invoiceNumber: string;
      clientName: string;
      total: number;
      displayStatus: string;
      status: string;
      issueDate: string;
      dueDate: string | null;
    }[];
  }>(`/api/mobile/invoices?workspaceId=${encodeURIComponent(workspaceId)}`);
}

export function createInvoice(body: Record<string, unknown>) {
  return mobileFetch<{ id: string; invoiceNumber: string }>("/api/mobile/invoices", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateInvoiceStatus(body: {
  workspaceId: string;
  invoiceId: string;
  status: string;
}) {
  return mobileFetch("/api/mobile/invoices", { method: "PATCH", body: JSON.stringify(body) });
}

export function fetchBudgets(workspaceId: string) {
  return mobileFetch<{
    items: {
      id: string;
      name: string;
      amount: number;
      spent: number;
      remaining: number;
      percentage: number;
    }[];
  }>(`/api/mobile/budgets?workspaceId=${encodeURIComponent(workspaceId)}`);
}

export function createBudget(body: {
  workspaceId: string;
  name: string;
  amount: number;
  categoryId?: string;
}) {
  return mobileFetch("/api/mobile/budgets", { method: "POST", body: JSON.stringify(body) });
}

export function fetchGoals(workspaceId: string) {
  return mobileFetch<{
    items: {
      id: string;
      name: string;
      targetAmount: number;
      currentAmount: number;
      remaining: number;
      percentage: number;
    }[];
  }>(`/api/mobile/goals?workspaceId=${encodeURIComponent(workspaceId)}`);
}

export function createGoal(body: { workspaceId: string; name: string; targetAmount: number }) {
  return mobileFetch("/api/mobile/goals", { method: "POST", body: JSON.stringify(body) });
}

export function updateGoalProgress(body: {
  workspaceId: string;
  goalId: string;
  amount: number;
}) {
  return mobileFetch("/api/mobile/goals", { method: "PATCH", body: JSON.stringify(body) });
}

export function fetchRecurring(workspaceId: string) {
  return mobileFetch<{ items: Record<string, unknown>[] }>(
    `/api/mobile/recurring?workspaceId=${encodeURIComponent(workspaceId)}`,
  );
}

export function createRecurring(body: Record<string, unknown>) {
  return mobileFetch("/api/mobile/recurring", { method: "POST", body: JSON.stringify(body) });
}

export function recordRecurring(body: { workspaceId: string; recurringId: string }) {
  return mobileFetch("/api/mobile/recurring", {
    method: "PATCH",
    body: JSON.stringify({ ...body, action: "record" }),
  });
}

export function fetchTransfers(workspaceId: string) {
  return mobileFetch<{ items: { _id: string; amount: number; fromAccountName: string; toAccountName: string; transferDate: string; description: string }[] }>(
    `/api/mobile/transfers?workspaceId=${encodeURIComponent(workspaceId)}`,
  );
}

export function createTransfer(body: Record<string, unknown>) {
  return mobileFetch("/api/mobile/transfers", { method: "POST", body: JSON.stringify(body) });
}

export function fetchReports(workspaceId: string, preset = "thisMonth") {
  const qs = new URLSearchParams({ workspaceId, preset });
  return mobileFetch<{
    summary: { income: number | null; expense: number | null; net: number | null };
    expenseBreakdown: { rows: { name: string; total: number | null }[] };
    incomeBreakdown: { rows: { name: string; total: number | null }[] };
    currency: string;
  }>(`/api/mobile/reports?${qs}`);
}

export function fetchPlan(workspaceId: string) {
  return mobileFetch<{
    plan: string;
    showAds: boolean;
    planName: string;
    features: string[];
    status: string;
    expiresAt: string | null;
  }>(`/api/mobile/plan?workspaceId=${encodeURIComponent(workspaceId)}`);
}

export function fetchBranding(workspaceId: string) {
  return mobileFetch<{
    businessName: string;
    logoUrl: string;
    taxId: string;
    businessPhone: string;
    businessAddress: string;
  }>(`/api/mobile/branding?workspaceId=${encodeURIComponent(workspaceId)}`);
}

export function saveBranding(body: Record<string, unknown>) {
  return mobileFetch("/api/mobile/branding", { method: "POST", body: JSON.stringify(body) });
}

export function fetchTeam(workspaceId: string) {
  return mobileFetch<{
    members: { userId: string; name: string; email: string; role: string }[];
    invitations: { id: string; email: string; role: string }[];
  }>(`/api/mobile/team?workspaceId=${encodeURIComponent(workspaceId)}`);
}

export { API_URL };
