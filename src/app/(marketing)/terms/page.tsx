import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage } from "@/features/marketing/components/legal-page";

type LegalSection = { heading: string; body: string };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.terms");
  return { title: t("metaTitle") };
}

export default async function TermsPage() {
  const t = await getTranslations("legal.terms");
  const sections = t.raw("sections") as LegalSection[];

  return (
    <LegalPage title={t("title")} subtitle={t("subtitle")}>
      {sections.map((section) => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>
          <p>{section.body}</p>
        </section>
      ))}
    </LegalPage>
  );
}
