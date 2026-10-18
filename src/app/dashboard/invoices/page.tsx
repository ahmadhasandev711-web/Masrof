import Link from "next/link";
import { requireSession } from "@/features/auth/session";
import { getActiveWorkspaceForPage } from "@/features/workspaces/page-gate";
import { canWorkspaceWrite, getWorkspaceAccess } from "@/features/workspaces/access";
import { listClientsForWorkspace } from "@/features/clients/data";
import { listProjectsForWorkspace } from "@/features/projects/data";
import { listAccountsForWorkspace } from "@/features/accounts/data";
import { listInvoicesWithFilters } from "@/features/invoices/data";
import { invoiceFiltersSchema } from "@/features/invoices/schemas";
import { getWorkspacePlanContext } from "@/features/subscriptions/data";
import { getPlanQuantityLimit } from "@/features/subscriptions/plan-config-data";
import {
  countInvoicesCreatedThisMonth,
  toQuantityUsage,
} from "@/features/subscriptions/plan-usage";
import { PlanUsageMeter } from "@/features/subscriptions/components/plan-usage-meter";
import { InvoiceCreationManager } from "@/features/invoices/components/invoice-creation-manager";
import { InvoiceSummaryCards } from "@/features/invoices/components/invoice-summary-cards";
import { InvoiceFiltersForm } from "@/features/invoices/components/invoice-filters";
import { InvoiceList } from "@/features/invoices/components/invoice-list";
import { InvoicePagination } from "@/features/invoices/components/invoice-pagination";
import { getTranslations } from "next-intl/server";

type SearchParams = Record<string, string | undefined>;

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireSession();
  const t = await getTranslations("pages.invoices");
  const tUsage = await getTranslations("dashboard.usage");
  const tDashboard = await getTranslations("dashboard");
  const tPlan = await getTranslations("dashboard.plan");
  const { activeWorkspace, redirect } = await getActiveWorkspaceForPage(session.user.id);
  if (redirect) return redirect;
  const workspaceId = activeWorkspace._id.toString();

  const [planCtx, access] = await Promise.all([
    getWorkspacePlanContext(session.user.id, workspaceId),
    getWorkspaceAccess(session.user.id, workspaceId),
  ]);
  const { plan, subscription } = planCtx;
  const canWrite = canWorkspaceWrite(access.membership.role);

  const rawParams = await searchParams;

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const thisMonthStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
  const thisMonthEnd = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate())}`;

  const isExplicitAll = rawParams.datePreset === "all";
  const hasExplicitDate = Boolean(rawParams.dateFrom || rawParams.dateTo);

  const effectiveDateFrom = isExplicitAll
    ? undefined
    : (rawParams.dateFrom ?? (hasExplicitDate ? undefined : thisMonthStart));
  const effectiveDateTo = isExplicitAll
    ? undefined
    : (rawParams.dateTo ?? (hasExplicitDate ? undefined : thisMonthEnd));
  const effectiveDatePreset = isExplicitAll
    ? "all"
    : (rawParams.datePreset ?? (!hasExplicitDate ? "thisMonth" : undefined));

  const filters = invoiceFiltersSchema.parse({
    workspaceId,
    status: rawParams.status || undefined,
    clientId: rawParams.clientId || undefined,
    projectId: rawParams.projectId || undefined,
    search: rawParams.search || undefined,
    dateFrom: effectiveDateFrom || undefined,
    dateTo: effectiveDateTo || undefined,
    page: rawParams.page || 1,
    pageSize: rawParams.pageSize || 20,
  });

  const [clients, projects, accounts, invoicesResult, invoiceCount, invoiceLimit] = await Promise.all([
    listClientsForWorkspace(workspaceId),
    listProjectsForWorkspace(workspaceId),
    listAccountsForWorkspace(workspaceId),
    listInvoicesWithFilters(filters),
    countInvoicesCreatedThisMonth(workspaceId),
    getPlanQuantityLimit(subscription.plan, "maxInvoicesPerMonth"),
  ]);

  const usage = toQuantityUsage(invoiceCount, invoiceLimit);

  const clientComboboxItems = clients.map((c) => ({
    _id: String(c._id),
    name: c.name,
    phone: c.phone ?? null,
  }));

  const projectOptions = projects.map((p) => ({
    _id: String(p._id),
    name: p.name,
    clientId: String(p.clientId),
  }));

  const accountOptions = accounts.map((acc) => ({
    _id: String(acc._id),
    name: acc.name,
    currency: acc.currency,
  }));

  return (
    <div className="flex w-full max-w-5xl flex-col gap-5">
      {/* 1. Header with Title & Quick Action Modals */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl">{t("title")}</h1>
          <p className="text-xs text-neutral-500 mt-0.5">{activeWorkspace.name}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canWrite && !usage.atLimit && plan.clientsAndProjects && (
            <InvoiceCreationManager
              workspaceId={workspaceId}
              clients={clientComboboxItems}
              projects={projectOptions}
              defaultClientId={rawParams.clientId}
              defaultProjectId={rawParams.projectId}
              canWrite={canWrite}
            />
          )}
        </div>
      </div>

      {plan.clientsAndProjects ? (
        <>
          {/* Plan Usage Meter if near or at limit */}
          {!usage.unlimited && (
            <PlanUsageMeter usage={usage} label={tUsage("invoicesThisMonth")} />
          )}

          {/* 2. Top Summary Metric Cards */}
          <InvoiceSummaryCards
            totalInvoiced={invoicesResult.summary.totalInvoiced}
            totalPaid={invoicesResult.summary.totalPaid}
            totalRemaining={invoicesResult.summary.totalRemaining}
            totalOverdue={invoicesResult.summary.totalOverdue}
            totalCount={invoicesResult.total}
            currency={activeWorkspace.currency}
          />

          {/* 3. Filter Bar */}
          <InvoiceFiltersForm
            clients={clientComboboxItems}
            projects={projectOptions}
            currentFilters={{
              status: rawParams.status,
              clientId: rawParams.clientId,
              projectId: rawParams.projectId,
              search: rawParams.search,
              dateFrom: effectiveDateFrom,
              dateTo: effectiveDateTo,
              datePreset: effectiveDatePreset,
            }}
          />

          {/* 4. Invoices List with actions */}
          <InvoiceList
            invoices={invoicesResult.items}
            currency={activeWorkspace.currency}
            workspaceId={workspaceId}
            workspaceName={activeWorkspace.name}
            canUseWhatsApp={Boolean(plan.whatsappReminders)}
            accounts={accountOptions}
            clients={clientComboboxItems}
            projects={projectOptions}
            canWrite={canWrite}
          />

          {/* 5. Pagination */}
          <InvoicePagination
            page={invoicesResult.page}
            totalPages={invoicesResult.totalPages}
            totalItems={invoicesResult.total}
            pageSize={invoicesResult.pageSize}
            searchParams={rawParams}
          />
        </>
      ) : (
        <div className="rounded-xl border border-[#065F46]/15 bg-[#ECFDF5]/50 p-4 text-sm text-[#1C1B1A]/70">
          {tDashboard("featureGate.clientsProjects")}{" "}
          <Link href="/pricing" className="font-medium text-[#065F46] hover:underline">
            {tPlan("viewPricing")}
          </Link>
          .
        </div>
      )}
    </div>
  );
}
