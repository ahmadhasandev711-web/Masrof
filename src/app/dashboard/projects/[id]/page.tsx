import { notFound } from "next/navigation";
import { ClientRedirect } from "@/components/client-redirect";
import { requireSession } from "@/features/auth/session";
import { getActiveWorkspaceForPage } from "@/features/workspaces/page-gate";
import { assertWorkspacePlanFeature } from "@/features/subscriptions/data";
import { getProjectFinancialDetails } from "@/features/projects/project-details-data";
import { ProjectDetailsView } from "@/features/projects/components/project-details-view";
import { getLocale } from "next-intl/server";
import type { AppLocale } from "@/i18n/config";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { activeWorkspace, redirect: onboardingRedirect } = await getActiveWorkspaceForPage(
    session.user.id,
  );
  if (onboardingRedirect) return onboardingRedirect;
  const workspaceId = activeWorkspace._id.toString();

  const planError = await assertWorkspacePlanFeature(
    session.user.id,
    workspaceId,
    "clientsAndProjects",
  );
  if (planError) {
    return <ClientRedirect href="/dashboard/projects?upgrade=projects" />;
  }

  const { id } = await params;
  const locale = (await getLocale()) as AppLocale;
  const details = await getProjectFinancialDetails(id, workspaceId, locale);

  if (!details) {
    notFound();
  }

  return <ProjectDetailsView data={details} currency={activeWorkspace.currency} />;
}
