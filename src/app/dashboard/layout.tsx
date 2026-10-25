import { ClientRedirect } from "@/components/client-redirect";
import { requireSession } from "@/features/auth/session";
import { getCurrentWorkspaceContext } from "@/features/workspaces/current";
import { resolveWorkspaceSubscriptionFromDocument, getUserSubscription } from "@/features/subscriptions/data";
import { AccountSuspendedScreen } from "@/features/subscriptions/components/account-suspended-screen";
import { DashboardShell } from "@/features/dashboard/components/dashboard-shell";
import { isAdminEmail } from "@/lib/admin";

export const maxDuration = 60;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  const [userSubscription, { workspaces, activeWorkspace }] = await Promise.all([
    getUserSubscription(session.user.id),
    getCurrentWorkspaceContext(session.user.id),
  ]);

  if (userSubscription.isSuspended) {
    return <AccountSuspendedScreen />;
  }

  if (!activeWorkspace) {
    return <ClientRedirect href="/onboarding" />;
  }

  // activeWorkspace comes from listWorkspacesForUser (membership-verified, team-feature gated),
  // so we derive the plan from it directly instead of re-running the access queries.
  const workspaceSubscription = await resolveWorkspaceSubscriptionFromDocument(
    session.user.id,
    activeWorkspace,
  );

  if (workspaceSubscription.isSuspended) {
    return <AccountSuspendedScreen />;
  }

  return (
    <DashboardShell
      userName={session.user.name}
      planId={workspaceSubscription.plan}
      planViaTeam={workspaceSubscription.isTeamMember}
      personalPlanId={userSubscription.plan}
      isAdmin={isAdminEmail(session.user.email)}
      workspaces={workspaces.map((w) => ({
        id: w._id.toString(),
        name: w.name,
        type: w.type,
      }))}
      activeWorkspaceId={activeWorkspace._id.toString()}
    >
      {children}
    </DashboardShell>
  );
}
