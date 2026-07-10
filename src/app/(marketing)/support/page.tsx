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
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-sm font-medium text-[#065F46]">{t("eyebrow")}</p>
      <h1 className="mt-2 font-[family-name:var(--font-marketing-display)] text-4xl font-semibold text-[#1C1B1A]">
        {t("title")}
      </h1>
      <p className="mt-3 text-lg text-[#1C1B1A]/65">{t("subtitle")}</p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <a
          href={support.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col rounded-2xl border border-[#065F46]/20 bg-[#ECFDF5] p-6 transition hover:border-[#065F46]/40 hover:shadow-md"
        >
          <span className="text-2xl">💬</span>
          <span className="mt-3 font-semibold text-[#065F46]">{t("whatsapp")}</span>
          <span className="mt-1 text-sm text-[#1C1B1A]/65" dir="ltr">
            {support.whatsappDisplay}
          </span>
          <span className="mt-3 text-sm font-medium text-[#065F46]">{t("whatsappOpen")}</span>
        </a>

        <a
          href={`mailto:${support.email}`}
          className="flex flex-col rounded-2xl border border-[#E4DFD3] bg-white p-6 transition hover:border-[#065F46]/30 hover:shadow-md"
        >
          <span className="text-2xl">✉️</span>
          <span className="mt-3 font-semibold text-[#1C1B1A]">{t("email")}</span>
          <span className="mt-1 text-sm text-[#1C1B1A]/65" dir="ltr">
            {support.email}
          </span>
          <span className="mt-3 text-sm font-medium text-[#065F46]">{t("emailSend")}</span>
        </a>
      </div>

      {(support.facebookUrl || support.linkedinUrl) && (
        <div className="mt-8 rounded-2xl border border-[#E4DFD3] bg-[#F3F0E8]/50 p-6">
          <p className="font-medium text-[#1C1B1A]">{t("followUs")}</p>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            {support.facebookUrl && (
              <a href={support.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-[#065F46] hover:underline">
                {t("facebook")}
              </a>
            )}
            {support.linkedinUrl && (
              <a href={support.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-[#065F46] hover:underline">
                {t("linkedin")}
              </a>
            )}
          </div>
        </div>
      )}

      <p className="mt-8 text-sm text-[#1C1B1A]/50">
        {t("faqHint")}{" "}
        <Link href="/faq" className="text-[#065F46] hover:underline">
          {t("faqLink")}
        </Link>
        .
      </p>
    </div>
  );
}
