"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const tPage = useTranslations("pages.error");
  const tCoreErrors = useTranslations("core.errors");

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-neutral-900">{tPage("title")}</h1>
        <p className="mt-2 text-sm text-neutral-500">
          {error.message || tCoreErrors("unexpected")}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
          >
            {tCoreErrors("tryAgain")}
          </button>
          <Link
            href="/"
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            {tPage("home")}
          </Link>
        </div>
      </div>
    </main>
  );
}
