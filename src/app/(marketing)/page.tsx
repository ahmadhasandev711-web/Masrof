import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { AgencyShowcaseCard } from "@/features/marketing/components/agency-showcase-card";
import { getDirection, type AppLocale } from "@/i18n/config";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("homepage.landing");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://sanadat.site";
  const ogLocale = locale === "ar" ? "ar_EG" : "en_US";

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: appUrl,
    },
    openGraph: {
      title: t("metaTitle"),
      description: t("metaDescription"),
      url: appUrl,
      siteName: "سندات | Sanadat",
      locale: ogLocale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("metaTitle"),
      description: t("metaDescription"),
    },
    robots: { index: true, follow: true },
  };
}

export default async function MarketingHomePage() {
  const locale = (await getLocale()) as AppLocale;
  const dir = getDirection(locale);
  const t = await getTranslations("homepage.landing");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://sanadat.site";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "سندات | Sanadat",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, PWA, iOS, Android",
    inLanguage: ["ar", "en"],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EGP",
    },
    description: t("metaDescription"),
    url: appUrl,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="overflow-x-hidden bg-[#FBF9F4] text-[#1C1B1A]">
        {/* ========================================================= */}
        {/* 1. HERO SECTION                                           */}
        {/* ========================================================= */}
        <section className="relative overflow-hidden border-b border-[#E4DFD3]/80 bg-gradient-to-b from-[#ECFDF5]/60 via-[#FBF9F4] to-[#FBF9F4] pt-12 pb-16 sm:pt-20 sm:pb-24">
          {/* Subtle decorative glow blobs */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-emerald-200/30 blur-3xl" />
          <div className="pointer-events-none absolute top-1/2 -left-32 h-80 w-80 rounded-full bg-teal-200/20 blur-3xl" />

          <div className="relative mx-auto max-w-5xl px-6">
            <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
              {/* Left/Main Column: Value Proposition */}
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-700/20 bg-emerald-50/80 px-3.5 py-1 text-xs font-semibold text-emerald-800 shadow-xs">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span>{t("hero.badge")}</span>
                </div>

                <h1 className="mt-5 font-[family-name:var(--font-marketing-display)] text-4xl font-bold leading-[1.2] text-[#1C1B1A] sm:text-5xl lg:text-[3.25rem]">
                  {t("hero.title")}
                </h1>

                <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#1C1B1A]/75">
                  {t("hero.subtitle")}
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    href="/register"
                    className="rounded-xl bg-[#065F46] px-7 py-3.5 text-base font-semibold text-white shadow-md shadow-[#065F46]/25 transition hover:bg-[#054d3a] hover:shadow-lg hover:shadow-[#065F46]/30"
                  >
                    {t("hero.ctaPrimary")}
                  </Link>
                  <a
                    href="#features"
                    className="rounded-xl border border-neutral-300 bg-white/80 px-6 py-3.5 text-base font-medium text-neutral-700 backdrop-blur-xs transition hover:bg-neutral-50 hover:border-neutral-400"
                  >
                    {t("hero.ctaSecondary")}
                  </a>
                </div>

                {/* Trust badges */}
                <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-[#1C1B1A]/60">
                  <span className="flex items-center gap-1.5">
                    <span className="text-emerald-700 font-bold">✓</span>{" "}
                    {t("hero.trust0")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-emerald-700 font-bold">✓</span>{" "}
                    {t("hero.trust1")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-emerald-700 font-bold">✓</span>{" "}
                    {t("hero.trust2")}
                  </span>
                </div>
              </div>

              {/* Right Column: Visual Showcase Mockup */}
              <div className="lg:col-span-5">
                <AgencyShowcaseCard locale={locale} />
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 2. CORE PAIN POINTS: BEFORE VS SANADAT                   */}
        {/* ========================================================= */}
        <section className="border-b border-[#E4DFD3]/70 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-6">
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                {t("pain.eyebrow")}
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-marketing-display)] text-3xl font-bold text-[#1C1B1A] sm:text-4xl">
                {t("pain.title")}
              </h2>
              <p className="mt-3 text-base text-[#1C1B1A]/65">
                {t("pain.subtitle")}
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: (
                    <svg className="h-6 w-6 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ),
                  bg: "bg-amber-100/80 border border-amber-200/60",
                },
                {
                  icon: (
                    <svg className="h-6 w-6 text-sky-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  ),
                  bg: "bg-sky-100/80 border border-sky-200/60",
                },
                {
                  icon: (
                    <svg className="h-6 w-6 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                    </svg>
                  ),
                  bg: "bg-emerald-100/80 border border-emerald-200/60",
                },
              ].map(({ icon, bg }, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-neutral-200 bg-[#FBF9F4] p-6 transition hover:shadow-md hover:border-emerald-600/30"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${bg}`}
                  >
                    {icon}
                  </div>
                  <h3 className="mt-4 font-bold text-lg text-neutral-900">
                    {t(`pain.cards.${i}.title` as Parameters<typeof t>[0])}
                  </h3>
                  <p className="mt-2 text-xs font-semibold text-rose-700">
                    {t("pain.beforeLabel")}
                  </p>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    {t(`pain.cards.${i}.before` as Parameters<typeof t>[0])}
                  </p>
                  <div className="mt-3 border-t border-neutral-200/80 pt-3">
                    <p className="text-xs font-semibold text-emerald-800">
                      {t("pain.afterLabel")}
                    </p>
                    <p className="text-xs text-neutral-700 leading-relaxed">
                      {t(`pain.cards.${i}.after` as Parameters<typeof t>[0])}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 3. CORE FEATURES GRID                                     */}
        {/* ========================================================= */}
        <section id="features" className="border-b border-[#E4DFD3]/80 py-16 sm:py-24">
          <div className="mx-auto max-w-5xl px-6">
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                {t("features.eyebrow")}
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-marketing-display)] text-3xl font-bold text-[#1C1B1A] sm:text-4xl">
                {t("features.title")}
              </h2>
              <p className="mt-3 text-base text-[#1C1B1A]/65">
                {t("features.subtitle")}
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                // 0: A4 & POS Invoices
                <svg key="0" className="h-5 w-5 text-emerald-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>,
                // 1: WhatsApp read tracking
                <svg key="1" className="h-5 w-5 text-emerald-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>,
                // 2: Client Statement
                <svg key="2" className="h-5 w-5 text-emerald-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>,
                // 3: Projects profitability
                <svg key="3" className="h-5 w-5 text-emerald-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                </svg>,
                // 4: Accounts & Currencies
                <svg key="4" className="h-5 w-5 text-emerald-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>,
                // 5: Workspaces & Team
                <svg key="5" className="h-5 w-5 text-emerald-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                </svg>,
              ].map((icon, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-[#E4DFD3] bg-white p-6 shadow-xs transition hover:border-emerald-600/40 hover:shadow-md"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/50">
                    {icon}
                  </span>
                  <h3 className="mt-4 font-bold text-neutral-900 text-lg">
                    {t(`features.items.${i}.title` as Parameters<typeof t>[0])}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                    {t(`features.items.${i}.body` as Parameters<typeof t>[0])}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 4. WORKFLOW: 3 SIMPLE STEPS                               */}
        {/* ========================================================= */}
        <section className="border-b border-[#E4DFD3]/80 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-6">
            <div className="text-center max-w-xl mx-auto">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                {t("steps.eyebrow")}
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-marketing-display)] text-3xl font-bold text-[#1C1B1A]">
                {t("steps.title")}
              </h2>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {([0, 1, 2] as const).map((i) => (
                <div
                  key={i}
                  className="relative rounded-2xl border border-neutral-200 bg-[#FBF9F4] p-6 text-center"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-800 font-mono text-sm font-bold text-white shadow-xs">
                    {t(`steps.items.${i}.number` as Parameters<typeof t>[0])}
                  </span>
                  <h3 className="mt-4 font-bold text-neutral-900 text-base">
                    {t(`steps.items.${i}.title` as Parameters<typeof t>[0])}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-neutral-600">
                    {t(`steps.items.${i}.body` as Parameters<typeof t>[0])}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 5. TESTIMONIALS                                           */}
        {/* ========================================================= */}
        <section className="border-b border-[#E4DFD3]/80 bg-[#FBF9F4] py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-6">
            <div className="text-center max-w-xl mx-auto">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                {t("testimonials.eyebrow")}
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-marketing-display)] text-3xl font-bold text-[#1C1B1A]">
                {t("testimonials.title")}
              </h2>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {([0, 1, 2] as const).map((i) => (
                <blockquote
                  key={i}
                  className={
                    i === 1
                      ? "rounded-2xl border border-emerald-300 bg-emerald-50/50 p-6 shadow-xs"
                      : "rounded-2xl border border-[#E4DFD3] bg-white p-6 shadow-xs"
                  }
                >
                  <p
                    className={
                      i === 1
                        ? "text-sm leading-relaxed text-neutral-800"
                        : "text-sm leading-relaxed text-neutral-700"
                    }
                  >
                    {t(
                      `testimonials.items.${i}.quote` as Parameters<typeof t>[0]
                    )}
                  </p>
                  <footer
                    className={
                      i === 1
                        ? "mt-5 border-t border-emerald-200/60 pt-3"
                        : "mt-5 border-t border-neutral-100 pt-3"
                    }
                  >
                    <p
                      className={
                        i === 1
                          ? "font-bold text-emerald-950 text-sm"
                          : "font-bold text-emerald-900 text-sm"
                      }
                    >
                      {t(
                        `testimonials.items.${i}.name` as Parameters<typeof t>[0]
                      )}
                    </p>
                    <p
                      className={
                        i === 1
                          ? "text-xs text-emerald-800/80"
                          : "text-xs text-neutral-500"
                      }
                    >
                      {t(
                        `testimonials.items.${i}.role` as Parameters<typeof t>[0]
                      )}
                    </p>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 6. TRANSPARENT PRICING PREVIEW                            */}
        {/* ========================================================= */}
        <section className="border-b border-[#E4DFD3]/80 bg-white py-16 sm:py-24">
          <div className="mx-auto max-w-5xl px-6">
            <div className="text-center max-w-xl mx-auto">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                {t("pricing.eyebrow")}
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-marketing-display)] text-3xl font-bold text-[#1C1B1A] sm:text-4xl">
                {t("pricing.title")}
              </h2>
              <p className="mt-3 text-base text-[#1C1B1A]/65">
                {t("pricing.subtitle")}
              </p>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-2 max-w-3xl mx-auto">
              {/* Free Plan */}
              <div className="rounded-2xl border border-neutral-200 bg-[#FBF9F4] p-7 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-xl text-neutral-900">
                    {t("pricing.free.name")}
                  </h3>
                  <p className="mt-2 text-3xl font-black text-neutral-900">
                    {t("pricing.free.price")}{" "}
                    <span className="text-sm font-normal text-neutral-500">
                      {t("pricing.free.period")}
                    </span>
                  </p>
                  <p className="mt-3 text-xs text-neutral-600 leading-relaxed">
                    {t("pricing.free.desc")}
                  </p>
                  <ul className="mt-6 space-y-2.5 text-xs text-neutral-700">
                    {([0, 1, 2, 3, 4] as const).map((i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-emerald-700 font-bold">✓</span>
                        {t(
                          `pricing.free.features.${i}` as Parameters<
                            typeof t
                          >[0]
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href="/register"
                  className="mt-8 block rounded-xl border border-neutral-300 bg-white py-3 text-center text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
                >
                  {t("pricing.free.cta")}
                </Link>
              </div>

              {/* Pro Plan */}
              <div className="relative rounded-2xl border-2 border-[#065F46] bg-emerald-50/40 p-7 shadow-lg shadow-emerald-950/5 flex flex-col justify-between">
                <div className="absolute -top-3 left-6 rounded-full bg-[#065F46] px-3.5 py-1 text-[11px] font-bold text-white shadow-xs">
                  {t("pricing.mostPopular")}
                </div>
                <div>
                  <h3 className="font-bold text-xl text-emerald-950">
                    {t("pricing.pro.name")}
                  </h3>
                  <div className="mt-2 flex items-baseline gap-2">
                    <p className="text-3xl font-black text-emerald-950">
                      {t("pricing.pro.price")}{" "}
                      <span className="text-sm font-normal text-neutral-600">
                        {t("pricing.pro.period")}
                      </span>
                    </p>
                  </div>
                  <div className="mt-1.5 inline-flex items-center rounded-md bg-emerald-100/90 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                    {t("pricing.pro.yearlyOption")}
                  </div>
                  <p className="mt-3 text-xs text-neutral-600 leading-relaxed">
                    {t("pricing.pro.desc")}
                  </p>
                  <ul className="mt-6 space-y-2.5 text-xs text-neutral-800">
                    {([0, 1, 2, 3, 4, 5] as const).map((i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-emerald-700 font-bold">✓</span>
                        {i <= 1 ? (
                          <strong className="font-semibold">
                            {t(
                              `pricing.pro.features.${i}` as Parameters<
                                typeof t
                              >[0]
                            )}
                          </strong>
                        ) : (
                          t(
                            `pricing.pro.features.${i}` as Parameters<
                              typeof t
                            >[0]
                          )
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href="/register"
                  className="mt-8 block rounded-xl bg-[#065F46] py-3 text-center text-sm font-semibold text-white shadow-md shadow-[#065F46]/20 transition hover:bg-[#054d3a]"
                >
                  {t("pricing.pro.cta")}
                </Link>
              </div>
            </div>

            <div className="mt-10 text-center">
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-800/25 bg-white px-6 py-2.5 text-sm font-semibold text-emerald-800 shadow-xs transition hover:bg-emerald-50 hover:border-emerald-800"
              >
                <span>{locale === "en" ? "View full feature comparison table" : "عرض جدول مقارنة المزايا والخصائص بالكامل"}</span>
                <span dir="ltr">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 7. FREQUENTLY ASKED QUESTIONS (FAQ)                       */}
        {/* ========================================================= */}
        <section className="border-b border-[#E4DFD3]/80 bg-[#FBF9F4] py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-6">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                {t("faq.eyebrow")}
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-marketing-display)] text-3xl font-bold text-[#1C1B1A]">
                {t("faq.title")}
              </h2>
            </div>

            <div className="mt-10 divide-y divide-neutral-200/80 rounded-2xl border border-[#E4DFD3] bg-white p-6 shadow-xs">
              {([0, 1, 2, 3] as const).map((i) => (
                <div key={i} className="py-4">
                  <h3 className="font-bold text-neutral-900 text-sm">
                    {t(`faq.items.${i}.q` as Parameters<typeof t>[0])}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-neutral-600">
                    {t(`faq.items.${i}.a` as Parameters<typeof t>[0])}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/faq"
                className="text-xs font-semibold text-emerald-800 hover:underline inline-flex items-center gap-1"
              >
                <span>{locale === "en" ? "More questions? Visit our FAQ center" : "هل لديك أسئلة أخرى؟ تفضل بزيارة مركز الأسئلة الشائعة"}</span>
                <span dir="ltr">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 8. FINAL CONVERSION CALL-TO-ACTION                        */}
        {/* ========================================================= */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#ECFDF5]/80 to-[#D1FAE5]/60 py-20 text-center">
          <div className="mx-auto max-w-2xl px-6">
            <span className="inline-block rounded-full bg-emerald-800/10 px-3 py-1 text-xs font-bold text-emerald-900">
              {t("cta.badge")}
            </span>
            <h2 className="mt-4 font-[family-name:var(--font-marketing-display)] text-3xl font-extrabold text-[#1C1B1A] sm:text-4xl">
              {t("cta.title")}
            </h2>
            <p className="mt-3 text-base text-[#1C1B1A]/70">
              {t("cta.subtitle")}
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/register"
                className="rounded-xl bg-[#065F46] px-8 py-4 text-base font-bold text-white shadow-lg shadow-[#065F46]/30 transition hover:bg-[#054d3a] hover:scale-[1.02]"
              >
                {t("cta.button")}
              </Link>
            </div>
            <p className="mt-4 text-xs text-neutral-500">{t("cta.note")}</p>
          </div>
        </section>
      </div>
    </>
  );
}
