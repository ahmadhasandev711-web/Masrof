"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { signOutAction } from "@/features/auth/actions/sign-out";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("auth");
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await signOutAction();
          window.location.assign("/login");
        });
      }}
      className="rounded-lg border border-neutral-300 px-2.5 py-1.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 sm:px-3 disabled:opacity-50 dark:border-[#26302C] dark:text-[#9AA39F] dark:hover:bg-[#1E2824] dark:hover:text-[#ECEAE4]"
    >
      {pending ? t("signingOut") || "..." : compact ? t("signOutShort") : t("signOut")}
    </button>
  );
}
