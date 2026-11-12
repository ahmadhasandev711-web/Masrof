"use client";

import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { signOutAction } from "@/features/auth/actions/sign-out";

function SignOutSubmit({ compact }: { compact: boolean }) {
  const { pending } = useFormStatus();
  const t = useTranslations("auth");

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-neutral-300 px-2.5 py-1.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 sm:px-3 disabled:opacity-50"
    >
      {pending ? t("signingOut") || "..." : compact ? t("signOutShort") : t("signOut")}
    </button>
  );
}

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  return (
    <form action={signOutAction} className="inline">
      <SignOutSubmit compact={compact} />
    </form>
  );
}
