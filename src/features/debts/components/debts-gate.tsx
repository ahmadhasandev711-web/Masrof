"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function DebtsGate() {
  const t = useTranslations("forms.debts");

  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-emerald-900/10 dark:border-[#26302C] bg-white dark:bg-[#161E1B] p-6 shadow-sm sm:p-10">
      <div className="flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-600/20 dark:border-[#34D399]/30 bg-emerald-50 dark:bg-[#0F2E24] px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-[#34D399]">
          <span>{t("gateBadge")}</span>
          <span className="rounded bg-emerald-800 dark:bg-[#10B981] px-1.5 py-0.2 text-[10px] text-white dark:text-[#04231A]">PRO</span>
        </div>

        <h2 className="mt-4 text-2xl font-bold tracking-tight text-neutral-900 dark:text-[#ECEAE4] sm:text-3xl">
          {t("gateTitle")}
        </h2>

        <p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-600 dark:text-[#9AA39F] sm:text-base">
          {t("gateDescription")}
        </p>

        <div className="mt-8 grid w-full gap-4 text-start sm:grid-cols-3">
          <div className="rounded-xl border border-neutral-100 dark:border-[#26302C] bg-[#FBF9F4] dark:bg-[#1E2824] p-4">
            <span className="text-2xl">📋</span>
            <h3 className="mt-2 text-sm font-bold text-neutral-900 dark:text-[#ECEAE4]">{t("gateFeature1Title")}</h3>
            <p className="mt-1 text-xs text-neutral-600 dark:text-[#9AA39F]">
              {t("gateFeature1Desc")}
            </p>
          </div>

          <div className="rounded-xl border border-neutral-100 dark:border-[#26302C] bg-[#FBF9F4] dark:bg-[#1E2824] p-4">
            <span className="text-2xl">⚡</span>
            <h3 className="mt-2 text-sm font-bold text-neutral-900 dark:text-[#ECEAE4]">{t("gateFeature2Title")}</h3>
            <p className="mt-1 text-xs text-neutral-600 dark:text-[#9AA39F]">
              {t("gateFeature2Desc")}
            </p>
          </div>

          <div className="rounded-xl border border-neutral-100 dark:border-[#26302C] bg-[#FBF9F4] dark:bg-[#1E2824] p-4">
            <span className="text-2xl">📊</span>
            <h3 className="mt-2 text-sm font-bold text-neutral-900 dark:text-[#ECEAE4]">{t("gateFeature3Title")}</h3>
            <p className="mt-1 text-xs text-neutral-600 dark:text-[#9AA39F]">
              {t("gateFeature3Desc")}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            href="/dashboard/plan"
            className="inline-flex items-center justify-center rounded-xl bg-[#065F46] dark:bg-[#10B981] px-8 py-3 text-sm font-semibold text-white dark:text-[#04231A] shadow-md transition hover:bg-[#065F46]/90 dark:hover:bg-[#34D399] hover:shadow-lg"
          >
            {t("gateCta")}
          </Link>
          <span className="text-xs text-neutral-500 dark:text-[#9AA39F]">
            {t("gateCtaNote")}
          </span>
        </div>
      </div>
    </div>
  );
}
