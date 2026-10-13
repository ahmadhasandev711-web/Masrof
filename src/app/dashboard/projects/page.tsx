import { requireSession } from "@/features/auth/session";
import { getActiveWorkspaceForPage } from "@/features/workspaces/page-gate";
import { canWorkspaceWrite, getWorkspaceAccess } from "@/features/workspaces/access";
import { listClientsForWorkspace } from "@/features/clients/data";
import { listProjectsWithTotals } from "@/features/projects/data";
import { ProjectCreationManager } from "@/features/projects/components/project-creation-manager";
import { ProjectSummaryCards } from "@/features/projects/components/project-summary-cards";
import { ProjectList } from "@/features/projects/components/project-list";
import { getWorkspacePlanContext } from "@/features/subscriptions/data";
import { getPlanQuantityLimit } from "@/features/subscriptions/plan-config-data";
import { countActiveProjectsForWorkspace, toQuantityUsage } from "@/features/subscriptions/plan-usage";
import { PlanUsageMeter } from "@/features/subscriptions/components/plan-usage-meter";
import { getTranslations } from "next-intl/server";

export default async function ProjectsPage() {
  const session = await requireSession();
  const t = await getTranslations("pages.projects");
  const tUsage = await getTranslations("dashboard.usage");
  const { activeWorkspace, redirect } = await getActiveWorkspaceForPage(session.user.id);
  if (redirect) return redirect;
  const workspaceId = activeWorkspace._id.toString();

  const [{ plan, subscription }, access, clients, projects, activeCount] = await Promise.all([
    getWorkspacePlanContext(session.user.id, workspaceId),
    getWorkspaceAccess(session.user.id, workspaceId),
    listClientsForWorkspace(workspaceId),
    listProjectsWithTotals(workspaceId),
    countActiveProjectsForWorkspace(workspaceId),
  ]);
  const canWrite = canWorkspaceWrite(access.membership.role);
  const projectLimit = await getPlanQuantityLimit(subscription.plan, "maxActiveProjects");
  const usage = toQuantityUsage(activeCount, projectLimit);

  const inProgressCount = projects.filter((p) => p.status === "active").length;
  const completedCount = projects.filter((p) => p.status === "completed").length;
  const totalInvoiced = projects.reduce((sum, p) => sum + p.invoicedTotal, 0);
  const totalExpenses = projects.reduce((sum, p) => sum + p.expenseTotal, 0);
  const totalNetProfit = projects.reduce((sum, p) => sum + p.netProfit, 0);
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
        totalProjects={projects.length}
        inProgressCount={inProgressCount}
        completedCount={completedCount}
        totalInvoiced={totalInvoiced}
        totalNetProfit={totalNetProfit}
        totalExpectedProfit={totalExpectedProfit}
        currency={activeWorkspace.currency}
      />

      {/* 3. Project List */}
      <ProjectList
        projects={projects}
        workspaceId={workspaceId}
        currency={activeWorkspace.currency}
        workspaceName={activeWorkspace.name}
        canUseWhatsApp={plan.whatsappReminders}
      />
    </div>
  );
}
