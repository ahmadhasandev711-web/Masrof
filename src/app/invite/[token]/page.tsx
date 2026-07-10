import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentSession } from "@/features/auth/session";
import { getInvitationByToken } from "@/features/workspaces/members-data";
import {
  AcceptInvitationButton,
  InviteLoginPrompt,
} from "@/features/workspaces/components/accept-invitation-button";

export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const t = await getTranslations("workspaceTeam");
  const invitation = await getInvitationByToken(token);

  if (!invitation) notFound();

  const session = await getCurrentSession();

  const emailMatches =
    session != null && session.user.email.toLowerCase() === invitation.email.toLowerCase();

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-sm font-medium text-[#065F46]">{t("invitePageEyebrow")}</p>
      <h1 className="mt-3 font-[family-name:var(--font-marketing-display)] text-3xl font-semibold text-[#1C1B1A]">
        {invitation.workspaceName}
      </h1>
      <p className="mt-4 text-[#1C1B1A]/65">
        {t("invitePageBody", { email: invitation.email })}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {!session && <InviteLoginPrompt token={token} email={invitation.email} />}
        {session && emailMatches && <AcceptInvitationButton token={token} />}
        {session && !emailMatches && (
          <p className="text-sm text-amber-800">{t("wrongAccount", { email: invitation.email })}</p>
        )}
        <Link
          href="/"
          className="rounded-lg border border-[#E4DFD3] px-4 py-2 text-sm text-[#065F46] hover:bg-[#F3F0E8]"
        >
          {t("backHome")}
        </Link>
      </div>
    </main>
  );
}
