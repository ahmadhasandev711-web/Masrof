"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { acceptInvitationAction } from "@/features/workspaces/actions/members";

export function AcceptInvitationButton({ token }: { token: string }) {
  const t = useTranslations("workspaceTeam");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleAccept() {
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
    <button
      type="button"
      disabled={pending}
      onClick={handleAccept}
      className="rounded-lg bg-[#065F46] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#054d3a] disabled:opacity-60 dark:bg-[#10B981] dark:text-[#04231A] dark:hover:bg-[#34D399]"
    >
      {pending ? t("accepting") : t("acceptInvite")}
    </button>
  );
}

export function InviteLoginPrompt({ token, email }: { token: string; email: string }) {
  const t = useTranslations("workspaceTeam");
  const invitePath = `/invite/${token}`;
  const loginHref = `/login?redirectTo=${encodeURIComponent(invitePath)}`;
  const registerHref = `/register?redirectTo=${encodeURIComponent(invitePath)}&email=${encodeURIComponent(email)}`;

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Link
        href={loginHref}
        className="rounded-lg border border-[#065F46] px-5 py-2.5 text-sm font-medium text-[#065F46] hover:bg-[#F3F0E8] dark:border-[#34D399] dark:text-[#34D399] dark:hover:bg-[#1E2824]"
      >
        {t("loginToAccept")}
      </Link>
      <Link
        href={registerHref}
        className="rounded-lg bg-[#065F46] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#054d3a] dark:bg-[#10B981] dark:text-[#04231A] dark:hover:bg-[#34D399]"
      >
        {t("registerToAccept")}
      </Link>
    </div>
  );
}
