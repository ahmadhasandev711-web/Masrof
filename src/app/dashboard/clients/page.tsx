import { requireSession } from "@/features/auth/session";
import { getActiveWorkspaceForPage } from "@/features/workspaces/page-gate";
import { canWorkspaceWrite, getWorkspaceAccess } from "@/features/workspaces/access";
import { listClientsForWorkspace } from "@/features/clients/data";
import { ClientCreationManager } from "@/features/clients/components/client-creation-manager";
import { ClientSummaryCards } from "@/features/clients/components/client-summary-cards";
import { ClientList } from "@/features/clients/components/client-list";
import { getWorkspacePlanContext } from "@/features/subscriptions/data";
import { getPlanQuantityLimit } from "@/features/subscriptions/plan-config-data";
import { countClientsForWorkspace, toQuantityUsage } from "@/features/subscriptions/plan-usage";
import { PlanUsageMeter } from "@/features/subscriptions/components/plan-usage-meter";
import { getTranslations } from "next-intl/server";

export default async function ClientsPage() {
  const session = await requireSession();
  const t = await getTranslations("pages.clients");
  const tUsage = await getTranslations("dashboard.usage");
  const { activeWorkspace, redirect } = await getActiveWorkspaceForPage(session.user.id);
  if (redirect) return redirect;

  const workspaceId = activeWorkspace._id.toString();
  const [{ subscription }, access, clients, clientCount] = await Promise.all([
    getWorkspacePlanContext(session.user.id, workspaceId),
    getWorkspaceAccess(session.user.id, workspaceId),
    listClientsForWorkspace(workspaceId),
    countClientsForWorkspace(workspaceId),
  ]);
  const canWrite = canWorkspaceWrite(access.membership.role);
  const clientLimit = await getPlanQuantityLimit(subscription.plan, "maxClients");
  const usage = toQuantityUsage(clientCount, clientLimit);

  const clientsWithProjects = clients.filter((c) => c.projectCount > 0).length;
  const totalProjects = clients.reduce((sum, c) => sum + c.projectCount, 0);

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
        totalClients={clients.length}
        clientsWithProjects={clientsWithProjects}
        totalProjects={totalProjects}
      />

      {/* 3. Clients List */}
      <ClientList clients={clients} workspaceId={workspaceId} />
    </div>
  );
}
