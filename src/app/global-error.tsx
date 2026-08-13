"use client";

import { NextIntlClientProvider, useTranslations } from "next-intl";
import arMessages from "@/i18n/messages/ar";
import enMessages from "@/i18n/messages/en";
import { LOCALE_COOKIE, isAppLocale, type AppLocale } from "@/i18n/config";

function resolveLocale(): AppLocale {
  if (typeof document === "undefined") {
    return "ar";
  }

  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]+)`));
  const value = match?.[1] ?? "ar";
  return isAppLocale(value) ? value : "ar";
}

function GlobalErrorContent({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const tCoreErrors = useTranslations("errors");

  return (
    <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-lg font-semibold text-neutral-900">{tCoreErrors("appError")}</h1>
      <p className="mt-2 text-sm text-neutral-500">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
      >
        {tCoreErrors("reload")}
      </button>
    </div>
  );
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = resolveLocale();
  const messages = locale === "en" ? enMessages : arMessages;

  return (
    <html lang={locale}>
      <body className="flex min-h-screen items-center justify-center bg-neutral-50 p-4 font-sans">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <GlobalErrorContent error={error} reset={reset} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
