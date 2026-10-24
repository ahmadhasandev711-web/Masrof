import { getAuthCookie } from "@/lib/auth-client";
import { API_URL } from "@/lib/config";
import { scopedCacheKey } from "@/lib/cache-scope";
import type {
  TransactionInput,
  InvoiceInput,
  TransferInput,
  AccountInput,
  CategoryInput,
  DebtInput,
  DebtPaymentInput,
  CreateWorkspaceInput,
} from "@/lib/validation";

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

const apiCache = new Map<string, { data: unknown; timestamp: number }>();
const DEFAULT_CACHE_TTL_MS = 60_000; // 60 seconds

export function invalidateCache(pattern?: string): void {
  if (!pattern) {
    apiCache.clear();
    return;
  }
  for (const key of apiCache.keys()) {
    if (key.includes(pattern)) {
      apiCache.delete(key);
    }
  }
}

export function clearAllCache(): void {
  apiCache.clear();
}

export function getCached<T>(path: string): T | undefined {
  const cached = apiCache.get(scopedCacheKey(path));
  return cached ? (cached.data as T) : undefined;
}

async function mobileFetch<T>(
  path: string,
  init?: RequestInit,
  options?: { skipCache?: boolean; ttlMs?: number },
): Promise<T> {
  const method = init?.method?.toUpperCase() ?? "GET";
  const isGet = method === "GET";

  const cacheKey = scopedCacheKey(path);

  if (isGet && !options?.skipCache) {
    const cached = apiCache.get(cacheKey);
    const ttl = options?.ttlMs ?? DEFAULT_CACHE_TTL_MS;
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data as T;
    }
  }

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
  const result = (await response.json()) as T;

  if (isGet) {
    apiCache.set(cacheKey, { data: result, timestamp: Date.now() });
  }

  return result;
}

export type MobileEntitlements = {
  user: { id: string; name: string; email: string };
  plan: "free" | "pro";
  showAds: boolean;
  isSuspended: boolean;
  flags?: Record<string, boolean>;
  limits?: {
    maxInvoicesPerMonth: number;
    maxClients: number;
    maxActiveProjects: number;
    maxWorkspaces: number;
  };
};

export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";

export type WorkspaceItem = {
  id: string;
  name: string;
  type: string;
  currency: string;
  businessName: string | null;
  role?: WorkspaceRole;
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
  nameEn: string | null;
  displayName: string;
  slug: string | null;
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

export async function createWorkspace(body: CreateWorkspaceInput) {
  const result = await mobileFetch<{ workspaceId: string }>("/api/mobile/workspaces", {
    method: "POST",
    body: JSON.stringify(body),
  });
  invalidateCache("workspaces");
  return result;
}

export function fetchDashboard(workspaceId: string, skipCache = false) {
  return mobileFetch<DashboardSummary>(
    `/api/mobile/dashboard?workspaceId=${encodeURIComponent(workspaceId)}`,
    undefined,
    { skipCache },
  );
}

export function fetchAccounts(workspaceId: string, skipCache = false) {
  return mobileFetch<{ items: AccountItem[] }>(
    `/api/mobile/accounts?workspaceId=${encodeURIComponent(workspaceId)}`,
    undefined,
    { skipCache },
  );
}

export async function createAccount(body: AccountInput) {
  const result = await mobileFetch<AccountItem>("/api/mobile/accounts", {
    method: "POST",
    body: JSON.stringify(body),
  });
  invalidateCache("accounts");
  invalidateCache("dashboard");
  invalidateCache("reports");
  return result;
}

export function fetchCategories(
  workspaceId: string,
  kind?: "income" | "expense",
  skipCache = false,
  locale: "ar" | "en" = "ar",
) {
  const qs = new URLSearchParams({ workspaceId, locale });
  if (kind) qs.set("kind", kind);
  return mobileFetch<{ items: CategoryItem[] }>(`/api/mobile/categories?${qs}`, undefined, { skipCache });
}

export async function createCategory(body: CategoryInput) {
  const result = await mobileFetch("/api/mobile/categories", { method: "POST", body: JSON.stringify(body) });
  invalidateCache("categories");
  return result;
}

export type TransactionListResult = {
  items: TransactionItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type TransactionFilters = {
  search?: string;
  type?: "income" | "expense";
};

export function fetchTransactions(
  workspaceId: string,
  page = 1,
  skipCache = false,
  filters?: TransactionFilters,
) {
  const qs = new URLSearchParams({ workspaceId, page: String(page), pageSize: "30" });
  if (filters?.search?.trim()) qs.set("search", filters.search.trim());
  if (filters?.type) qs.set("type", filters.type);
  return mobileFetch<TransactionListResult>(`/api/mobile/transactions?${qs}`, undefined, {
    skipCache,
  });
}

export async function createTransaction(body: TransactionInput) {
  const result = await mobileFetch<{ id: string }>("/api/mobile/transactions", {
    method: "POST",
    body: JSON.stringify(body),
  });
  invalidateCache("transactions");
  invalidateCache("dashboard");
  invalidateCache("accounts");
  invalidateCache("reports");
  invalidateCache("budgets");
  return result;
}

export function fetchClients(workspaceId: string, skipCache = false) {
  return mobileFetch<{
    items: { _id: string; name: string; email: string | null; phone: string | null; projectCount: number }[];
  }>(`/api/mobile/clients?workspaceId=${encodeURIComponent(workspaceId)}`, undefined, { skipCache });
}

export async function createClient(body: {
  workspaceId: string;
  name: string;
  email?: string;
  phone?: string;
  idempotencyKey: string;
}) {
  const result = await mobileFetch("/api/mobile/clients", { method: "POST", body: JSON.stringify(body) });
  invalidateCache("clients");
  return result;
}

export function fetchProjects(workspaceId: string, skipCache = false) {
  return mobileFetch<{ items: Record<string, unknown>[] }>(
    `/api/mobile/projects?workspaceId=${encodeURIComponent(workspaceId)}`,
    undefined,
    { skipCache },
  );
}

export async function createProject(body: Record<string, unknown>) {
  const result = await mobileFetch("/api/mobile/projects", { method: "POST", body: JSON.stringify(body) });
  invalidateCache("projects");
  invalidateCache("dashboard");
  return result;
}

export function fetchInvoices(workspaceId: string, page = 1, skipCache = false) {
  return mobileFetch<{
    items: {
      _id: string;
      invoiceNumber: string;
      clientName: string;
      total: number;
      paidAmount?: number;
      remainingAmount?: number;
      displayStatus: string;
      status: string;
      issueDate: string;
      dueDate: string | null;
      shareToken?: string | null;
    }[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>(
    `/api/mobile/invoices?workspaceId=${encodeURIComponent(workspaceId)}&page=${page}&pageSize=30`,
    undefined,
    { skipCache },
  );
}

export async function createInvoice(body: InvoiceInput) {
  const result = await mobileFetch<{ id: string; invoiceNumber: string }>("/api/mobile/invoices", {
    method: "POST",
    body: JSON.stringify(body),
  });
  invalidateCache("invoices");
  invalidateCache("dashboard");
  invalidateCache("reports");
  return result;
}

export async function recordInvoicePayment(body: {
  workspaceId: string;
  invoiceId: string;
  accountId: string;
  categoryId?: string | null;
  amount: number;
  paymentDate: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  idempotencyKey: string;
}) {
  const result = await mobileFetch<{ paymentId: string }>("/api/mobile/invoices/payments", {
    method: "POST",
    body: JSON.stringify(body),
  });
  invalidateCache("invoices");
  invalidateCache("transactions");
  invalidateCache("accounts");
  invalidateCache("dashboard");
  invalidateCache("reports");
  return result;
}

export function fetchBudgets(workspaceId: string, skipCache = false) {
  return mobileFetch<{
    items: {
      id: string;
      name: string;
      amount: number;
      spent: number;
      remaining: number;
      percentage: number;
    }[];
  }>(`/api/mobile/budgets?workspaceId=${encodeURIComponent(workspaceId)}`, undefined, { skipCache });
}

export async function createBudget(body: {
  workspaceId: string;
  name: string;
  amount: number;
  categoryId?: string;
  idempotencyKey: string;
}) {
  const result = await mobileFetch("/api/mobile/budgets", { method: "POST", body: JSON.stringify(body) });
  invalidateCache("budgets");
  invalidateCache("dashboard");
  return result;
}

export function fetchGoals(workspaceId: string, skipCache = false) {
  return mobileFetch<{
    items: {
      id: string;
      name: string;
      targetAmount: number;
      currentAmount: number;
      remaining: number;
      percentage: number;
    }[];
  }>(`/api/mobile/goals?workspaceId=${encodeURIComponent(workspaceId)}`, undefined, { skipCache });
}

export async function createGoal(body: {
  workspaceId: string;
  name: string;
  targetAmount: number;
  idempotencyKey: string;
}) {
  const result = await mobileFetch("/api/mobile/goals", { method: "POST", body: JSON.stringify(body) });
  invalidateCache("goals");
  invalidateCache("dashboard");
  return result;
}

export async function updateGoalProgress(body: {
  workspaceId: string;
  goalId: string;
  amount: number;
}) {
  const result = await mobileFetch("/api/mobile/goals", { method: "PATCH", body: JSON.stringify(body) });
  invalidateCache("goals");
  invalidateCache("dashboard");
  return result;
}

export function fetchRecurring(workspaceId: string, skipCache = false) {
  return mobileFetch<{ items: Record<string, unknown>[] }>(
    `/api/mobile/recurring?workspaceId=${encodeURIComponent(workspaceId)}`,
    undefined,
    { skipCache },
  );
}

export async function createRecurring(body: Record<string, unknown>) {
  const result = await mobileFetch("/api/mobile/recurring", { method: "POST", body: JSON.stringify(body) });
  invalidateCache("recurring");
  invalidateCache("dashboard");
  return result;
}

export async function recordRecurring(body: { workspaceId: string; recurringId: string }) {
  const result = await mobileFetch("/api/mobile/recurring", {
    method: "PATCH",
    body: JSON.stringify({ ...body, action: "record" }),
  });
  invalidateCache("recurring");
  invalidateCache("transactions");
  invalidateCache("dashboard");
  invalidateCache("accounts");
  return result;
}

export function fetchTransfers(workspaceId: string, page = 1, skipCache = false) {
  return mobileFetch<{
    items: { _id: string; amount: number; fromAccountName: string; toAccountName: string; transferDate: string; description: string }[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>(
    `/api/mobile/transfers?workspaceId=${encodeURIComponent(workspaceId)}&page=${page}&pageSize=30`,
    undefined,
    { skipCache },
  );
}

export async function createTransfer(body: TransferInput) {
  const result = await mobileFetch("/api/mobile/transfers", { method: "POST", body: JSON.stringify(body) });
  invalidateCache("transfers");
  invalidateCache("accounts");
  invalidateCache("dashboard");
  return result;
}

export function fetchReports(workspaceId: string, preset = "thisMonth", skipCache = false) {
  const qs = new URLSearchParams({ workspaceId, preset });
  return mobileFetch<{
    summary: { income: number | null; expense: number | null; net: number | null };
    expenseBreakdown: { rows: { name: string; total: number | null }[] };
    incomeBreakdown: { rows: { name: string; total: number | null }[] };
    currency: string;
  }>(`/api/mobile/reports?${qs}`, undefined, { skipCache });
}

export function fetchPlan(workspaceId: string, skipCache = false) {
  return mobileFetch<{
    plan: string;
    showAds: boolean;
    planName: string;
    features: string[];
    status: string;
    expiresAt: string | null;
  }>(`/api/mobile/plan?workspaceId=${encodeURIComponent(workspaceId)}`, undefined, { skipCache });
}

export function fetchBranding(workspaceId: string, skipCache = false) {
  return mobileFetch<{
    businessName: string;
    logoUrl: string;
    taxId: string;
    businessPhone: string;
    businessAddress: string;
  }>(`/api/mobile/branding?workspaceId=${encodeURIComponent(workspaceId)}`, undefined, { skipCache });
}

export async function saveBranding(body: Record<string, unknown>) {
  const result = await mobileFetch("/api/mobile/branding", { method: "POST", body: JSON.stringify(body) });
  invalidateCache("branding");
  invalidateCache("workspaces");
  return result;
}

export async function uploadBrandingLogo(
  workspaceId: string,
  file: { uri: string; mimeType?: string | null; fileName?: string | null },
) {
  const form = new FormData();
  form.append("workspaceId", workspaceId);
  const name = file.fileName ?? "logo.jpg";
  const type = file.mimeType ?? "image/jpeg";
  form.append("file", { uri: file.uri, name, type } as unknown as Blob);

  const cookies = getAuthCookie();
  const response = await fetch(`${API_URL}/api/uploads/branding`, {
    method: "POST",
    headers: cookies ? { Cookie: cookies } : {},
    body: form,
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

  const data = (await response.json()) as { url: string };
  invalidateCache("branding");
  invalidateCache("workspaces");
  return data;
}

export function fetchTeam(workspaceId: string, skipCache = false) {
  return mobileFetch<{
    members: { userId: string; name: string; email: string; role: string }[];
    invitations: { id: string; email: string; role: string }[];
  }>(`/api/mobile/team?workspaceId=${encodeURIComponent(workspaceId)}`, undefined, { skipCache });
}

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
  status: "active" | "paid";
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

export function fetchDebts(
  workspaceId: string,
  status?: "active" | "paid",
  skipCache = false,
) {
  const qs = new URLSearchParams({ workspaceId });
  if (status) qs.set("status", status);
  return mobileFetch<{ items: DebtItem[]; summary: DebtSummary }>(
    `/api/mobile/debts?${qs}`,
    undefined,
    { skipCache },
  );
}

export async function createDebt(body: DebtInput) {
  const result = await mobileFetch<{ id: string }>("/api/mobile/debts", {
    method: "POST",
    body: JSON.stringify(body),
  });
  invalidateCache("debts");
  invalidateCache("dashboard");
  return result;
}

export function fetchDebtPayments(
  workspaceId: string,
  debtId: string,
  skipCache = false,
) {
  const qs = new URLSearchParams({ workspaceId, debtId });
  return mobileFetch<{ items: DebtPaymentItem[] }>(
    `/api/mobile/debts/payments?${qs}`,
    undefined,
    { skipCache },
  );
}

export async function recordDebtPayment(body: DebtPaymentInput) {
  const result = await mobileFetch<{ paymentId: string; transactionId: string }>(
    "/api/mobile/debts/payments",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
  invalidateCache("debts");
  invalidateCache("accounts");
  invalidateCache("transactions");
  invalidateCache("dashboard");
  invalidateCache("reports");
  return result;
}

export { API_URL };
