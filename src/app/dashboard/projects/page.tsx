import { requireSession } from "@/features/auth/session";
import { getActiveWorkspaceForPage } from "@/features/workspaces/page-gate";
import { listClientsForWorkspace } from "@/features/clients/data";
import { listProjectsWithTotals } from "@/features/projects/data";
import { CreateProjectForm } from "@/features/projects/components/create-project-form";
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
  const [{ plan, subscription }, clients, projects, activeCount] = await Promise.all([
    getWorkspacePlanContext(session.user.id, workspaceId),
    listClientsForWorkspace(workspaceId),
    listProjectsWithTotals(workspaceId),
    countActiveProjectsForWorkspace(workspaceId),
  ]);
  const projectLimit = await getPlanQuantityLimit(subscription.plan, "maxActiveProjects");
  const usage = toQuantityUsage(activeCount, projectLimit);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">{t("title")}</h1>
        <p className="text-sm text-neutral-500">{activeWorkspace.name}</p>
      </div>

      <PlanUsageMeter usage={usage} label={tUsage("activeProjects")} />
      {usage.atLimit ? null : (
        <CreateProjectForm workspaceId={workspaceId} clients={clients} />
      )}

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
