"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth/client";
import { signOutAction } from "@/features/auth/actions/sign-out";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("auth");
  const [isPending, setIsPending] = useState(false);

  async function handleSignOut(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (isPending) return;
    setIsPending(true);

    try {
      await authClient.signOut().catch(() => {});
    } catch {
      // Ignore client fetch error and proceed with server cleanup
    }

    // Immediate client cookie cleanup as fail-safe
    if (typeof document !== "undefined") {
      document.cookie = "better-auth.session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "__Secure-better-auth.session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }

    try {
      await signOutAction();
    } catch {
      // Fallback hard navigation
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  }

  return (
    <form onSubmit={handleSignOut} className="inline">
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg border border-neutral-300 px-2.5 py-1.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 sm:px-3 disabled:opacity-50"
      >
        {isPending ? t("signingOut") || "..." : compact ? t("signOutShort") : t("signOut")}
      </button>
    </form>
  );
}
