import { Suspense } from "react";
import { requireSession } from "@/features/auth/session";
import { getActiveWorkspaceForPage } from "@/features/workspaces/page-gate";
import { getWorkspaceAccess } from "@/features/workspaces/access";
import {
  DashboardHome,
  DashboardHomeSkeleton,
} from "@/features/dashboard/components/dashboard-home";

export const maxDuration = 60;

export default async function DashboardPage() {
  const session = await requireSession();
  const { activeWorkspace, redirect } = await getActiveWorkspaceForPage(session.user.id);
  if (redirect) return redirect;

  const access = await getWorkspaceAccess(session.user.id, activeWorkspace._id.toString());
  const isOwner = access.membership.role === "owner";

  return (
    <Suspense fallback={<DashboardHomeSkeleton />}>
      <DashboardHome
        userId={session.user.id}
        userEmail={session.user.email}
        workspaceId={activeWorkspace._id.toString()}
        workspaceName={activeWorkspace.name}
        currency={activeWorkspace.currency}
        isOwner={isOwner}
      />
    </Suspense>
  );
}
