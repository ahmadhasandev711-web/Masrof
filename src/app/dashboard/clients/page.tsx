import { requireSession } from "@/features/auth/session";
import { getActiveWorkspaceForPage } from "@/features/workspaces/page-gate";
import { listClientsForWorkspace } from "@/features/clients/data";
import { CreateClientForm } from "@/features/clients/components/create-client-form";
import { ClientList } from "@/features/clients/components/client-list";
import { getTranslations } from "next-intl/server";

export default async function ClientsPage() {
  const session = await requireSession();
  const t = await getTranslations("pages.clients");
  const { activeWorkspace, redirect } = await getActiveWorkspaceForPage(session.user.id);
  if (redirect) return redirect;

  const workspaceId = activeWorkspace._id.toString();
  const clients = await listClientsForWorkspace(workspaceId);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">{t("title")}</h1>
        <p className="text-sm text-neutral-500">{activeWorkspace.name}</p>
      </div>

      <CreateClientForm workspaceId={workspaceId} />

      <ClientList clients={clients} workspaceId={workspaceId} />
    </div>
  );
}
