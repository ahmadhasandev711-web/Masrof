"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { setLocaleAction } from "@/i18n/actions";
import { LOCALES, type AppLocale } from "@/i18n/config";

export function LocaleSwitcher({ className }: { className?: string }) {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const t = useTranslations("locale");
  const [pending, startTransition] = useTransition();

  function switchLocale(next: AppLocale) {
    if (next === locale || pending) return;
    startTransition(async () => {
      await setLocaleAction(next, pathname);
    });
  }

  return (
    <div
      className={`inline-flex items-center gap-0.5 rounded-lg border border-[#E4DFD3] bg-white p-0.5 text-xs ${className ?? ""}`}
      role="group"
      aria-label={t("label")}
    >
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          disabled={pending}
          onClick={() => switchLocale(code)}
          className={`rounded-md px-2 py-1 font-medium transition ${
            locale === code
              ? "bg-[#065F46] text-white"
              : "text-[#1C1B1A]/65 hover:bg-[#F3F0E8] hover:text-[#065F46]"
          }`}
          aria-pressed={locale === code}
        >
          {t(code)}
        </button>
      ))}
    </div>
  );
}
