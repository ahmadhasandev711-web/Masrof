/**
 * Named Zod schemas registered for OpenAPI generation.
 * Keep in sync when adding mobile response contracts.
 */
import { mobileErrorSchema, mobileOkSchema, mobileIdSchema } from "./common";
import {
  mobileWorkspacesListResponseSchema,
  mobileCreateWorkspaceResponseSchema,
  mobileBrandingSchema,
} from "./workspaces";
import { mobileEntitlementsResponseSchema, mobilePlanResponseSchema } from "./entitlements";
import { mobileClientsListResponseSchema, mobileClientCreatedSchema } from "./clients";
import { mobileProjectsListResponseSchema, mobileProjectCreatedSchema } from "./projects";
import { mobileAccountsListResponseSchema } from "./accounts";
import { mobileCategoriesListResponseSchema, mobileCategoryCreatedSchema } from "./categories";
import {
  mobileTransactionsPageResponseSchema,
  mobileTransactionCreatedSchema,
} from "./transactions";
import { mobileTransfersListResponseSchema } from "./transfers";
import {
  mobileInvoicesPageResponseSchema,
  mobileInvoiceCreatedSchema,
  mobileInvoicePaymentCreatedSchema,
  mobileInvoiceTemplatesListResponseSchema,
  mobileInvoiceTemplateCreatedSchema,
} from "./invoices";
import { mobileDebtsListResponseSchema, mobileDebtCreatedSchema } from "./debts";
import { mobileBudgetsListResponseSchema } from "./budgets";
import { mobileGoalsListResponseSchema } from "./goals";
import { mobileRecurringListResponseSchema } from "./recurring";
import { mobileDashboardResponseSchema } from "./dashboard";
import { mobileReportsResponseSchema } from "./reports";

export const mobileContractSchemas = {
  MobileError: mobileErrorSchema,
  MobileOk: mobileOkSchema,
  MobileId: mobileIdSchema,
  MobileWorkspacesListResponse: mobileWorkspacesListResponseSchema,
  MobileCreateWorkspaceResponse: mobileCreateWorkspaceResponseSchema,
  MobileBranding: mobileBrandingSchema,
  MobileEntitlementsResponse: mobileEntitlementsResponseSchema,
  MobilePlanResponse: mobilePlanResponseSchema,
  MobileClientsListResponse: mobileClientsListResponseSchema,
  MobileClientCreated: mobileClientCreatedSchema,
  MobileProjectsListResponse: mobileProjectsListResponseSchema,
  MobileProjectCreated: mobileProjectCreatedSchema,
  MobileAccountsListResponse: mobileAccountsListResponseSchema,
  MobileCategoriesListResponse: mobileCategoriesListResponseSchema,
  MobileCategoryCreated: mobileCategoryCreatedSchema,
  MobileTransactionsPageResponse: mobileTransactionsPageResponseSchema,
  MobileTransactionCreated: mobileTransactionCreatedSchema,
  MobileTransfersListResponse: mobileTransfersListResponseSchema,
  MobileInvoicesPageResponse: mobileInvoicesPageResponseSchema,
  MobileInvoiceCreated: mobileInvoiceCreatedSchema,
  MobileInvoicePaymentCreated: mobileInvoicePaymentCreatedSchema,
  MobileInvoiceTemplatesListResponse: mobileInvoiceTemplatesListResponseSchema,
  MobileInvoiceTemplateCreated: mobileInvoiceTemplateCreatedSchema,
  MobileDebtsListResponse: mobileDebtsListResponseSchema,
  MobileDebtCreated: mobileDebtCreatedSchema,
  MobileBudgetsListResponse: mobileBudgetsListResponseSchema,
  MobileGoalsListResponse: mobileGoalsListResponseSchema,
  MobileRecurringListResponse: mobileRecurringListResponseSchema,
  MobileDashboardResponse: mobileDashboardResponseSchema,
  MobileReportsResponse: mobileReportsResponseSchema,
} as const;

export const mobileOpenApiPaths: Array<{
  path: string;
  method: "get" | "post" | "patch";
  operationId: string;
  summary: string;
  responseSchema: keyof typeof mobileContractSchemas;
}> = [
  { path: "/api/mobile/entitlements", method: "get", operationId: "getEntitlements", summary: "Session entitlements", responseSchema: "MobileEntitlementsResponse" },
  { path: "/api/mobile/plan", method: "get", operationId: "getPlan", summary: "Workspace plan context", responseSchema: "MobilePlanResponse" },
  { path: "/api/mobile/workspaces", method: "get", operationId: "listWorkspaces", summary: "List workspaces", responseSchema: "MobileWorkspacesListResponse" },
  { path: "/api/mobile/workspaces", method: "post", operationId: "createWorkspace", summary: "Create workspace", responseSchema: "MobileCreateWorkspaceResponse" },
  { path: "/api/mobile/branding", method: "get", operationId: "getBranding", summary: "Workspace branding", responseSchema: "MobileBranding" },
  { path: "/api/mobile/branding", method: "post", operationId: "updateBranding", summary: "Update branding", responseSchema: "MobileOk" },
  { path: "/api/mobile/clients", method: "get", operationId: "listClients", summary: "List clients", responseSchema: "MobileClientsListResponse" },
  { path: "/api/mobile/clients", method: "post", operationId: "createClient", summary: "Create client", responseSchema: "MobileClientCreated" },
  { path: "/api/mobile/projects", method: "get", operationId: "listProjects", summary: "List projects", responseSchema: "MobileProjectsListResponse" },
  { path: "/api/mobile/projects", method: "post", operationId: "createProject", summary: "Create project", responseSchema: "MobileProjectCreated" },
  { path: "/api/mobile/accounts", method: "get", operationId: "listAccounts", summary: "List accounts", responseSchema: "MobileAccountsListResponse" },
  { path: "/api/mobile/accounts", method: "post", operationId: "createAccount", summary: "Create account", responseSchema: "MobileId" },
  { path: "/api/mobile/categories", method: "get", operationId: "listCategories", summary: "List categories", responseSchema: "MobileCategoriesListResponse" },
  { path: "/api/mobile/categories", method: "post", operationId: "createCategory", summary: "Create category", responseSchema: "MobileCategoryCreated" },
  { path: "/api/mobile/transactions", method: "get", operationId: "listTransactions", summary: "List transactions", responseSchema: "MobileTransactionsPageResponse" },
  { path: "/api/mobile/transactions", method: "post", operationId: "createTransaction", summary: "Create transaction", responseSchema: "MobileTransactionCreated" },
  { path: "/api/mobile/transfers", method: "get", operationId: "listTransfers", summary: "List transfers", responseSchema: "MobileTransfersListResponse" },
  { path: "/api/mobile/transfers", method: "post", operationId: "createTransfer", summary: "Create transfer", responseSchema: "MobileId" },
  { path: "/api/mobile/invoices", method: "get", operationId: "listInvoices", summary: "List invoices", responseSchema: "MobileInvoicesPageResponse" },
  { path: "/api/mobile/invoices", method: "post", operationId: "createInvoice", summary: "Create invoice", responseSchema: "MobileInvoiceCreated" },
  { path: "/api/mobile/invoices", method: "patch", operationId: "updateInvoiceStatus", summary: "Update invoice status", responseSchema: "MobileOk" },
  { path: "/api/mobile/invoices/payments", method: "post", operationId: "recordInvoicePayment", summary: "Record invoice payment", responseSchema: "MobileInvoicePaymentCreated" },
  { path: "/api/mobile/invoices/templates", method: "get", operationId: "listInvoiceTemplates", summary: "List invoice templates", responseSchema: "MobileInvoiceTemplatesListResponse" },
  { path: "/api/mobile/invoices/templates", method: "post", operationId: "createInvoiceTemplate", summary: "Create invoice template", responseSchema: "MobileInvoiceTemplateCreated" },
  { path: "/api/mobile/invoices/templates", method: "patch", operationId: "mutateInvoiceTemplate", summary: "Update, archive, or reorder invoice templates", responseSchema: "MobileOk" },
  { path: "/api/mobile/debts", method: "get", operationId: "listDebts", summary: "List debts", responseSchema: "MobileDebtsListResponse" },
  { path: "/api/mobile/debts", method: "post", operationId: "createDebt", summary: "Create debt", responseSchema: "MobileDebtCreated" },
  { path: "/api/mobile/budgets", method: "get", operationId: "listBudgets", summary: "List budgets", responseSchema: "MobileBudgetsListResponse" },
  { path: "/api/mobile/budgets", method: "post", operationId: "createBudget", summary: "Create budget", responseSchema: "MobileId" },
  { path: "/api/mobile/goals", method: "get", operationId: "listGoals", summary: "List savings goals", responseSchema: "MobileGoalsListResponse" },
  { path: "/api/mobile/goals", method: "post", operationId: "createGoal", summary: "Create savings goal", responseSchema: "MobileId" },
  { path: "/api/mobile/goals", method: "patch", operationId: "updateGoalProgress", summary: "Update goal progress", responseSchema: "MobileOk" },
  { path: "/api/mobile/recurring", method: "get", operationId: "listRecurring", summary: "List recurring expenses", responseSchema: "MobileRecurringListResponse" },
  { path: "/api/mobile/recurring", method: "post", operationId: "createRecurring", summary: "Create recurring expense", responseSchema: "MobileId" },
  { path: "/api/mobile/recurring", method: "patch", operationId: "recordRecurring", summary: "Record recurring expense", responseSchema: "MobileOk" },
  { path: "/api/mobile/dashboard", method: "get", operationId: "getDashboard", summary: "Dashboard overview", responseSchema: "MobileDashboardResponse" },
  { path: "/api/mobile/reports", method: "get", operationId: "getReports", summary: "Reports snapshot", responseSchema: "MobileReportsResponse" },
];
