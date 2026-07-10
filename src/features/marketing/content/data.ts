import "server-only";

import { unstable_cache } from "next/cache";
import { connectToDatabase } from "@/lib/db/mongoose";
import { SiteContentModel } from "@/models/site-content";
import { toPlain } from "@/lib/db/plain";
import {
  DEFAULT_HOMEPAGE_CONTENT,
  mergeHomepageContent,
  type HomepageContent,
} from "@/features/marketing/content/defaults";

async function fetchHomepageContent(): Promise<HomepageContent> {
  try {
    await connectToDatabase();
    const doc = await SiteContentModel.findOne({ key: "homepage" }).lean();
    if (!doc) {
      return DEFAULT_HOMEPAGE_CONTENT;
    }

    return mergeHomepageContent(
      toPlain({
        heroBadge: doc.heroBadge,
        heroTitle: doc.heroTitle,
        heroSubtitle: doc.heroSubtitle,
        heroCtaPrimary: doc.heroCtaPrimary,
        heroCtaSecondary: doc.heroCtaSecondary,
        stepsTitle: doc.stepsTitle,
        steps: doc.steps,
        blogTitle: doc.blogTitle,
        blogSubtitle: doc.blogSubtitle,
        newsletterTitle: doc.newsletterTitle,
        newsletterSubtitle: doc.newsletterSubtitle,
        finalCtaTitle: doc.finalCtaTitle,
        finalCtaSubtitle: doc.finalCtaSubtitle,
        finalCtaButton: doc.finalCtaButton,
        footerNewsletterTitle: doc.footerNewsletterTitle,
        footerNewsletterSubtitle: doc.footerNewsletterSubtitle,
      }),
    );
  } catch (error) {
    console.error("[homepage-content] falling back to defaults:", error);
    return DEFAULT_HOMEPAGE_CONTENT;
  }
}

const HOMEPAGE_CONTENT_TAG = "site-homepage-content";

export { HOMEPAGE_CONTENT_TAG };

const getCachedHomepageContent = unstable_cache(
  fetchHomepageContent,
  ["site-homepage-content"],
  { revalidate: 300, tags: [HOMEPAGE_CONTENT_TAG] },
);

/** Cached across requests — layout + homepage share one DB read. */
export async function getHomepageContent(): Promise<HomepageContent> {
  return getCachedHomepageContent();
}

export async function getHomepageContentForAdmin(): Promise<HomepageContent> {
  try {
    await connectToDatabase();
    const doc = await SiteContentModel.findOne({ key: "homepage" }).lean();
    if (!doc) {
      return DEFAULT_HOMEPAGE_CONTENT;
    }

    return mergeHomepageContent(
      toPlain({
        heroBadge: doc.heroBadge,
        heroTitle: doc.heroTitle,
        heroSubtitle: doc.heroSubtitle,
        heroCtaPrimary: doc.heroCtaPrimary,
        heroCtaSecondary: doc.heroCtaSecondary,
        stepsTitle: doc.stepsTitle,
        steps: doc.steps,
        blogTitle: doc.blogTitle,
        blogSubtitle: doc.blogSubtitle,
        newsletterTitle: doc.newsletterTitle,
        newsletterSubtitle: doc.newsletterSubtitle,
        finalCtaTitle: doc.finalCtaTitle,
        finalCtaSubtitle: doc.finalCtaSubtitle,
        finalCtaButton: doc.finalCtaButton,
        footerNewsletterTitle: doc.footerNewsletterTitle,
        footerNewsletterSubtitle: doc.footerNewsletterSubtitle,
      }),
    );
  } catch (error) {
    console.error("[homepage-content] admin load failed:", error);
    return DEFAULT_HOMEPAGE_CONTENT;
  }
}
