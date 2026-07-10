"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { acceptInvitationAction } from "@/features/workspaces/actions/members";

export function OnboardingInvitesPanel({
  invites,
}: {
  invites: Array<{ token: string; workspaceName: string; expiresAt: Date }>;
}) {
  const t = useTranslations("workspaceTeam");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (invites.length === 0) return null;

  function handleAccept(token: string) {
    startTransition(async () => {
      const result = await acceptInvitationAction(token);
      if (result.error) {
        alert(result.error);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <section className="mb-6 rounded-2xl border border-[#065F46]/20 bg-[#ECFDF5]/40 p-5">
      <h2 className="font-semibold text-[#065F46]">{t("onboardingInvitesTitle")}</h2>
      <p className="mt-1 text-sm text-neutral-600">{t("onboardingInvitesHint")}</p>
      <ul className="mt-4 space-y-3">
        {invites.map((invite) => (
          <li
            key={invite.token}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white bg-white/80 px-4 py-3"
          >
            <div>
              <p className="font-medium text-neutral-900">{invite.workspaceName}</p>
              <p className="text-xs text-neutral-500">{t("pendingExpires")}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => handleAccept(invite.token)}
                className="rounded-lg bg-[#065F46] px-4 py-2 text-sm font-medium text-white hover:bg-[#054d3a] disabled:opacity-60"
              >
                {pending ? t("accepting") : t("acceptInvite")}
              </button>
              <Link
                href={`/invite/${invite.token}`}
                className="rounded-lg border border-[#065F46]/30 px-4 py-2 text-sm text-[#065F46] hover:bg-white"
              >
                {t("viewInvite")}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
