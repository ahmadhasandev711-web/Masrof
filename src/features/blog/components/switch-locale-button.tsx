"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { setLocaleAction } from "@/i18n/actions";
import type { AppLocale } from "@/i18n/config";

export function SwitchLocaleButton({
  locale,
  pathname,
}: {
  locale: AppLocale;
  pathname: string;
}) {
  const tLocale = useTranslations("locale");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await setLocaleAction(locale, pathname);
          if (result.redirectTo) {
            window.location.assign(result.redirectTo);
            return;
          }
          router.refresh();
        })
      }
      className="rounded-lg bg-[#065F46] px-4 py-2 text-sm font-medium text-white hover:bg-[#054d3a] disabled:opacity-60"
    >
      {tLocale(locale)}
    </button>
  );
}
