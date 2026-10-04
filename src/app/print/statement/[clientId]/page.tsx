import { notFound } from "next/navigation";
import { ClientRedirect } from "@/components/client-redirect";
import { requireSession } from "@/features/auth/session";
import { getActiveWorkspaceForPage } from "@/features/workspaces/page-gate";
import { assertWorkspacePlanFeature } from "@/features/subscriptions/data";
import { getClientStatement } from "@/features/clients/statement-data";
import { ClientStatementDocument } from "@/features/clients/components/client-statement-document";
import "../../invoice/invoice-print.css";

export default async function PrintStatementPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const session = await requireSession();
  const { activeWorkspace, redirect: onboardingRedirect } = await getActiveWorkspaceForPage(
    session.user.id,
  );
  if (onboardingRedirect) return onboardingRedirect;
  const workspaceId = activeWorkspace._id.toString();

  const clientsError = await assertWorkspacePlanFeature(
    session.user.id,
    workspaceId,
    "clientsAndProjects",
  );
  if (clientsError) {
    return <ClientRedirect href="/dashboard/clients?upgrade=clients" />;
  }

  const { clientId } = await params;

  const statement = await getClientStatement(clientId, workspaceId, {
    name: activeWorkspace.name,
    businessName: activeWorkspace.businessName,
    logoUrl: activeWorkspace.logoUrl,
    taxId: activeWorkspace.taxId,
    businessPhone: activeWorkspace.businessPhone,
    businessAddress: activeWorkspace.businessAddress,
    currency: activeWorkspace.currency,
  });

  if (!statement) {
    notFound();
  }

  return <ClientStatementDocument statement={statement} returnHref="/dashboard/clients" />;
}
