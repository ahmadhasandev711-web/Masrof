"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const tPage = useTranslations("pages.error");
  const tCoreErrors = useTranslations("errors");

  return (
    <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm dark:border-red-900/60 dark:bg-[#161E1B]">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-[#ECEAE4]">{tPage("title")}</h2>
      <p className="mt-2 text-sm text-neutral-500 dark:text-[#9AA39F]">{error.message}</p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 dark:bg-[#10B981] dark:text-[#04231A] dark:hover:bg-[#34D399]"
        >
          {tCoreErrors("tryAgain")}
        </button>
        <Link
          href="/dashboard"
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:border-[#26302C] dark:text-[#ECEAE4] dark:hover:bg-[#1E2824]"
        >
          {tPage("home")}
        </Link>
      </div>
    </div>
  );
}
