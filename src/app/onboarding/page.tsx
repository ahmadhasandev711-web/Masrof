import { ClientRedirect } from "@/components/client-redirect";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { requireSession } from "@/features/auth/session";
import { userHasAnyWorkspace } from "@/features/workspaces/data";
import { getPendingInvitationsForEmail } from "@/features/workspaces/members-data";
import { CreateWorkspaceForm } from "@/features/workspaces/components/create-workspace-form";
import { OnboardingInvitesPanel } from "@/features/workspaces/components/onboarding-invites-panel";
import { getTranslations } from "next-intl/server";

export default async function OnboardingPage() {
  const session = await requireSession();
  const t = await getTranslations("pages.onboarding");

  const hasWorkspace = await userHasAnyWorkspace(session.user.id);
  if (hasWorkspace) {
    return <ClientRedirect href="/dashboard" />;
  }

  const pendingInvites = await getPendingInvitationsForEmail(session.user.email);
  const tPlans = await getTranslations("plans");

  const { WorkspaceMembershipModel } = await import("@/models/workspace-membership");
  const hadPreviousTeam = Boolean(
    await WorkspaceMembershipModel.findOne({
      userId: session.user.id,
      role: { $ne: "owner" },
    }).lean(),
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-6 pb-3 border-b border-neutral-100">
          <span className="text-xs font-bold text-[#065F46] tracking-wide">
            سندات | Sanadat
          </span>
          <LocaleSwitcher />
        </div>

        {hadPreviousTeam && (
          <div className="mb-4 rounded-xl border border-amber-200/80 bg-amber-50/80 p-3 text-xs text-amber-900 leading-relaxed">
            {tPlans("teamPlanExpiredNotice")}
          </div>
        )}

        <h1 className="mb-1 text-xl font-semibold text-neutral-900">
          {t("title")}
        </h1>
        <p className="mb-6 text-sm text-neutral-500">
          {t("subtitle")}
        </p>

        <OnboardingInvitesPanel invites={pendingInvites} />

        <CreateWorkspaceForm />
      </div>
    </main>
  );
}
