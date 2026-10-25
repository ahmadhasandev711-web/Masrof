import { requireSession } from "@/features/auth/session";
import { getActiveWorkspaceForPage } from "@/features/workspaces/page-gate";
import { canWorkspaceWrite, getWorkspaceAccess } from "@/features/workspaces/access";
import { listClientsForWorkspace } from "@/features/clients/data";
import { listProjectsWithTotals } from "@/features/projects/data";
import { ProjectCreationManager } from "@/features/projects/components/project-creation-manager";
import { ProjectSummaryCards } from "@/features/projects/components/project-summary-cards";
import { ProjectFilters } from "@/features/projects/components/project-filters";
import { ProjectList } from "@/features/projects/components/project-list";
import { ProjectPagination } from "@/features/projects/components/project-pagination";
import { getWorkspacePlanContext } from "@/features/subscriptions/data";
import { getPlanQuantityLimit } from "@/features/subscriptions/plan-config-data";
import { countActiveProjectsForWorkspace, toQuantityUsage } from "@/features/subscriptions/plan-usage";
import { PlanUsageMeter } from "@/features/subscriptions/components/plan-usage-meter";
import { getTranslations } from "next-intl/server";

type SearchParams = Record<string, string | undefined>;

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireSession();
  const t = await getTranslations("pages.projects");
  const tUsage = await getTranslations("dashboard.usage");
  const { activeWorkspace, redirect } = await getActiveWorkspaceForPage(session.user.id);
  if (redirect) return redirect;
  const workspaceId = activeWorkspace._id.toString();

  const [{ plan, subscription }, access, clients, allProjects, activeCount] = await Promise.all([
    getWorkspacePlanContext(session.user.id, workspaceId),
    getWorkspaceAccess(session.user.id, workspaceId),
    listClientsForWorkspace(workspaceId),
    listProjectsWithTotals(workspaceId),
    countActiveProjectsForWorkspace(workspaceId),
  ]);
  const canWrite = canWorkspaceWrite(access.membership.role);
  const projectLimit = await getPlanQuantityLimit(subscription.plan, "maxActiveProjects");
  const usage = toQuantityUsage(activeCount, projectLimit);

  const rawParams = await searchParams;
  const activeStatus = rawParams.status || "all";
  const searchQuery = (rawParams.q || "").trim().toLowerCase();

  const counts = {
    all: allProjects.length,
    active: allProjects.filter((p) => p.status === "active").length,
    completed: allProjects.filter((p) => p.status === "completed").length,
    on_hold: allProjects.filter((p) => p.status === "on_hold").length,
  };

  const filteredProjects = allProjects.filter((p) => {
    if (activeStatus !== "all" && p.status !== activeStatus) {
      return false;
    }
    if (searchQuery) {
      const nameMatch = p.name.toLowerCase().includes(searchQuery);
      const clientMatch = p.clientName ? p.clientName.toLowerCase().includes(searchQuery) : false;
      return Boolean(nameMatch || clientMatch);
    }
    return true;
  });

  const page = Math.max(1, parseInt(rawParams.page || "1", 10) || 1);
  const limit = Math.min(50, Math.max(5, parseInt(rawParams.limit || "10", 10) || 10));
  const totalPages = Math.ceil(filteredProjects.length / limit) || 1;
  const paginatedProjects = filteredProjects.slice((page - 1) * limit, page * limit);

  // Overall KPI summaries remain true to the entire workspace
  const inProgressCount = allProjects.filter((p) => p.status === "active").length;
  const completedCount = allProjects.filter((p) => p.status === "completed").length;
  const totalInvoiced = allProjects.reduce((sum, p) => sum + p.invoicedTotal, 0);
  const totalExpenses = allProjects.reduce((sum, p) => sum + p.expenseTotal, 0);
  const totalNetProfit = allProjects.reduce((sum, p) => sum + p.netProfit, 0);
  const totalExpectedProfit = totalInvoiced - totalExpenses;

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
            <ProjectCreationManager
              workspaceId={workspaceId}
              clients={clients}
              canWrite={canWrite}
            />
          )}
        </div>
      </div>

      {!usage.unlimited && (
        <PlanUsageMeter usage={usage} label={tUsage("activeProjects")} />
      )}

      {/* 2. Top Summary Metric Cards */}
      <ProjectSummaryCards
        totalProjects={allProjects.length}
        inProgressCount={inProgressCount}
        completedCount={completedCount}
        totalInvoiced={totalInvoiced}
        totalNetProfit={totalNetProfit}
        totalExpectedProfit={totalExpectedProfit}
        currency={activeWorkspace.currency}
      />

      {/* 3. Filter Toolbar & Search */}
      <ProjectFilters
        activeStatus={activeStatus}
        searchQuery={rawParams.q || ""}
        counts={counts}
        searchParams={rawParams}
      />

      {/* 4. Filtered & Paginated Project List */}
      <ProjectList
        projects={paginatedProjects}
        workspaceId={workspaceId}
        currency={activeWorkspace.currency}
        workspaceName={activeWorkspace.name}
        canUseWhatsApp={plan.whatsappReminders}
        canWrite={canWrite}
      />

      {/* 5. In-Place Smooth Pagination */}
      <ProjectPagination
        page={page}
        totalPages={totalPages}
        totalItems={filteredProjects.length}
        pageSize={limit}
        searchParams={rawParams}
      />
    </div>
  );
}
