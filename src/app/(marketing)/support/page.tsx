import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getSupportConfig } from "@/lib/support";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketing.supportPage");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function SupportPage() {
  const t = await getTranslations("marketing.supportPage");
  const support = getSupportConfig(t("whatsappPrefill"));

  return (
    <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
      {/* Header */}
      <div className="max-w-2xl text-center mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-700/20 bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-800">
          <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
          <span>{t("slaBadge")}</span>
        </div>

        <h1 className="mt-4 font-[family-name:var(--font-marketing-display)] text-3xl font-bold text-neutral-900 sm:text-4xl lg:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-base text-neutral-600 sm:text-lg">
          {t("subtitle")}
        </p>
        <p className="mt-2 text-xs font-medium text-neutral-400">
           {t("hours")}
        </p>
      </div>

      {/* Primary Channels Grid */}
      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {/* WhatsApp Channel */}
        <a
          href={support.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex flex-col justify-between rounded-2xl border-2 border-emerald-600/30 bg-emerald-50/40 p-7 transition hover:border-emerald-700 hover:shadow-lg hover:shadow-emerald-950/5"
        >
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm shadow-emerald-900/20">
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.54 1.771.785 2.791.785 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.771-5.768-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.073-2.127-.521-1.615-.67-2.66-2.306-2.74-2.413-.08-.108-.654-.87-.654-1.66 0-.79.413-1.178.559-1.336.146-.157.32-.197.426-.197.106 0 .213 0 .306.006.101.005.236-.039.369.281.137.33.468 1.144.509 1.228.04.084.067.183.013.29-.053.107-.08.173-.16.266-.08.093-.169.208-.242.279-.08.08-.163.167-.07.327.093.16.413.682.885 1.103.608.541 1.12.709 1.28.789.16.08.254.067.347-.04.094-.107.4-.467.507-.627.107-.16.213-.133.36-.08.147.053.934.44 1.094.52.16.08.267.12.307.187.04.067.04.387-.104.792zM12 2C6.477 2 2 6.477 2 12c0 1.891.526 3.66 1.438 5.176L2 22l4.981-1.307C8.423 21.536 10.151 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.273c-1.637 0-3.155-.474-4.437-1.289l-.318-.202-2.955.775.789-2.88-.222-.353A8.232 8.232 0 013.727 12c0-4.562 3.711-8.273 8.273-8.273 4.562 0 8.273 3.711 8.273 8.273 0 4.562-3.711 8.273-8.273 8.273z" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-bold text-neutral-900 group-hover:text-emerald-900">
              {t("whatsapp")}
            </h2>
            <p className="mt-1 text-sm font-semibold text-emerald-800" dir="ltr">
              {support.whatsappDisplay}
            </p>
            <p className="mt-2 text-xs text-neutral-600 leading-relaxed">
              {t("whatsappSub")}
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1.5 text-sm font-bold text-emerald-800">
            <span>{t("whatsappOpen")}</span>
          </div>
        </a>

        {/* Email Channel */}
        <a
          href={`mailto:${support.email}`}
          className="group relative flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-7 transition hover:border-neutral-300 hover:shadow-lg hover:shadow-neutral-950/5"
        >
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900 text-white shadow-sm">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h2 className="mt-4 text-xl font-bold text-neutral-900 group-hover:text-neutral-950">
              {t("email")}
            </h2>
            <p className="mt-1 text-sm font-semibold text-neutral-800" dir="ltr">
              {support.email}
            </p>
            <p className="mt-2 text-xs text-neutral-600 leading-relaxed">
              {t("emailSub")}
            </p>
          </div>
          <div className="mt-6 flex items-center gap-1.5 text-sm font-bold text-neutral-900 group-hover:text-emerald-800">
            <span>{t("emailSend")}</span>
          </div>
        </a>
      </div>

      {/* Agency & Enterprise Concierge Box */}
      <div className="mt-10 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/60 to-white p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="max-w-xl">
            <span className="inline-block rounded-md bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-900">
              Enterprise & Agencies
            </span>
            <h3 className="mt-2 text-lg font-bold text-neutral-900">
              {t("agencyTitle")}
            </h3>
            <p className="mt-1.5 text-xs text-neutral-600 leading-relaxed">
              {t("agencyDesc")}
            </p>
          </div>
          <a
            href={support.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-xl bg-emerald-800 px-5 py-3 text-center text-xs font-bold text-white shadow-sm transition hover:bg-emerald-900"
          >
            {t("whatsappOpen")}
          </a>
        </div>
      </div>

      {/* Social / Communities */}
      {(support.facebookUrl || support.linkedinUrl) && (
        <div className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50/50 p-6">
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
            {t("followUs")}
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            {support.facebookUrl && (
              <a
                href={support.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-emerald-800 hover:underline"
              >
                {t("facebook")}
              </a>
            )}
            {support.linkedinUrl && (
              <a
                href={support.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-emerald-800 hover:underline"
              >
                {t("linkedin")}
              </a>
            )}
          </div>
        </div>
      )}

      {/* FAQ Link Footer */}
      <p className="mt-10 text-center text-sm text-neutral-500">
        {t("faqHint")}{" "}
        <Link href="/faq" className="font-semibold text-emerald-800 hover:underline">
          {t("faqLink")}
        </Link>
        .
      </p>
    </div>
  );
}
