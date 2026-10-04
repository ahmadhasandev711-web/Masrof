"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function DebtsGate() {
  const t = useTranslations("forms.debts");

  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-emerald-900/10 bg-white p-6 shadow-sm sm:p-10">
      <div className="flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-600/20 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
          <span>{t("gateBadge")}</span>
          <span className="rounded bg-emerald-800 px-1.5 py-0.2 text-[10px] text-white">PRO</span>
        </div>

        <h2 className="mt-4 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
          {t("gateTitle")}
        </h2>

        <p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-600 sm:text-base">
          {t("gateDescription")}
        </p>

        <div className="mt-8 grid w-full gap-4 text-start sm:grid-cols-3">
          <div className="rounded-xl border border-neutral-100 bg-[#FBF9F4] p-4">
            <span className="text-2xl">💳</span>
            <h3 className="mt-2 text-sm font-bold text-neutral-900">{t("gateFeature1Title")}</h3>
            <p className="mt-1 text-xs text-neutral-600">
              {t("gateFeature1Desc")}
            </p>
          </div>

          <div className="rounded-xl border border-neutral-100 bg-[#FBF9F4] p-4">
            <span className="text-2xl">⚡</span>
            <h3 className="mt-2 text-sm font-bold text-neutral-900">{t("gateFeature2Title")}</h3>
            <p className="mt-1 text-xs text-neutral-600">
              {t("gateFeature2Desc")}
            </p>
          </div>

          <div className="rounded-xl border border-neutral-100 bg-[#FBF9F4] p-4">
            <span className="text-2xl">📊</span>
            <h3 className="mt-2 text-sm font-bold text-neutral-900">{t("gateFeature3Title")}</h3>
            <p className="mt-1 text-xs text-neutral-600">
              {t("gateFeature3Desc")}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <Link
            href="/dashboard/plan"
            className="inline-flex items-center justify-center rounded-xl bg-[#065F46] px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#065F46]/90 hover:shadow-lg"
          >
            {t("gateCta")}
          </Link>
          <span className="text-xs text-neutral-500">
            {t("gateCtaNote")}
          </span>
        </div>
      </div>
    </div>
  );
}
