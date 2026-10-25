import { requireSession } from "@/features/auth/session";
import { getActiveWorkspaceForPage } from "@/features/workspaces/page-gate";
import { canWorkspaceWrite, getWorkspaceAccess } from "@/features/workspaces/access";
import { listClientsWithFinancials } from "@/features/clients/data";
import { ClientCreationManager } from "@/features/clients/components/client-creation-manager";
import { ClientSummaryCards } from "@/features/clients/components/client-summary-cards";
import { ClientFilters } from "@/features/clients/components/client-filters";
import { ClientList } from "@/features/clients/components/client-list";
import { ClientPagination } from "@/features/clients/components/client-pagination";
import { getWorkspacePlanContext } from "@/features/subscriptions/data";
import { getPlanQuantityLimit } from "@/features/subscriptions/plan-config-data";
import { countClientsForWorkspace, toQuantityUsage } from "@/features/subscriptions/plan-usage";
import { PlanUsageMeter } from "@/features/subscriptions/components/plan-usage-meter";
import { getTranslations } from "next-intl/server";

type SearchParams = Record<string, string | undefined>;

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireSession();
  const t = await getTranslations("pages.clients");
  const tUsage = await getTranslations("dashboard.usage");
  const { activeWorkspace, redirect } = await getActiveWorkspaceForPage(session.user.id);
  if (redirect) return redirect;

  const workspaceId = activeWorkspace._id.toString();
  const [{ subscription }, access, allClients, clientCount] = await Promise.all([
    getWorkspacePlanContext(session.user.id, workspaceId),
    getWorkspaceAccess(session.user.id, workspaceId),
    listClientsWithFinancials(workspaceId),
    countClientsForWorkspace(workspaceId),
  ]);
  const canWrite = canWorkspaceWrite(access.membership.role);
  const clientLimit = await getPlanQuantityLimit(subscription.plan, "maxClients");
  const usage = toQuantityUsage(clientCount, clientLimit);

  const rawParams = await searchParams;
  const activeFilter = rawParams.status || "all";
  const searchQuery = (rawParams.q || "").trim().toLowerCase();

  const counts = {
    all: allClients.length,
    with_debt: allClients.filter((c) => c.outstandingBalance > 0).length,
    with_projects: allClients.filter((c) => c.projectCount > 0).length,
  };

  const filteredClients = allClients.filter((c) => {
    if (activeFilter === "with_debt" && c.outstandingBalance <= 0) {
      return false;
    }
    if (activeFilter === "with_projects" && c.projectCount <= 0) {
      return false;
    }
    if (searchQuery) {
      const nameMatch = c.name.toLowerCase().includes(searchQuery);
      const phoneMatch = c.phone ? c.phone.toLowerCase().includes(searchQuery) : false;
      const emailMatch = c.email ? c.email.toLowerCase().includes(searchQuery) : false;
      return Boolean(nameMatch || phoneMatch || emailMatch);
    }
    return true;
  });

  const page = Math.max(1, parseInt(rawParams.page || "1", 10) || 1);
  const limit = Math.min(50, Math.max(5, parseInt(rawParams.limit || "10", 10) || 10));
  const totalPages = Math.ceil(filteredClients.length / limit) || 1;
  const paginatedClients = filteredClients.slice((page - 1) * limit, page * limit);

  // Overall KPI summaries
  const clientsWithProjects = allClients.filter((c) => c.projectCount > 0).length;
  const totalInvoiced = allClients.reduce((sum, c) => sum + c.invoicedTotal, 0);
  const totalOutstanding = allClients.reduce((sum, c) => sum + c.outstandingBalance, 0);
  const clientsWithDebt = allClients.filter((c) => c.outstandingBalance > 0).length;

  return (
    <div className="flex w-full max-w-5xl flex-col gap-5">
      {/* 1. Header with Title & Quick Action Modal */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl">{t("title")}</h1>
          <p className="text-xs text-neutral-500 mt-0.5">{activeWorkspace.name}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canWrite && !usage.atLimit && (
            <ClientCreationManager
              workspaceId={workspaceId}
              canWrite={canWrite}
            />
          )}
        </div>
      </div>

      {!usage.unlimited && (
        <PlanUsageMeter usage={usage} label={tUsage("clients")} />
      )}

      {/* 2. Top Summary Metric Cards */}
      <ClientSummaryCards
        totalClients={allClients.length}
        clientsWithProjects={clientsWithProjects}
        totalInvoiced={totalInvoiced}
        totalOutstanding={totalOutstanding}
        clientsWithDebt={clientsWithDebt}
        currency={activeWorkspace.currency}
      />

      {/* 3. Filter Toolbar & Search */}
      <ClientFilters
        activeFilter={activeFilter}
        searchQuery={rawParams.q || ""}
        counts={counts}
        searchParams={rawParams}
      />

      {/* 4. Filtered & Paginated Clients List */}
      <ClientList
        clients={paginatedClients}
        workspaceId={workspaceId}
        currency={activeWorkspace.currency}
        canWrite={canWrite}
      />

      {/* 5. In-Place Smooth Pagination */}
      <ClientPagination
        page={page}
        totalPages={totalPages}
        totalItems={filteredClients.length}
        pageSize={limit}
        searchParams={rawParams}
      />
    </div>
  );
}
