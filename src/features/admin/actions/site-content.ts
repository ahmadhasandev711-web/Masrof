"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { connectToDatabase } from "@/lib/db/mongoose";
import { SiteContentModel } from "@/models/site-content";
import { DEFAULT_HOMEPAGE_CONTENT } from "@/features/marketing/content/defaults";
import { HOMEPAGE_CONTENT_TAG } from "@/features/marketing/content/data";

const stepSchema = z.object({
  number: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
});

const homepageSchema = z.object({
  heroBadge: z.string().min(1).max(120),
  heroTitle: z.string().min(1).max(200),
  heroSubtitle: z.string().min(1).max(500),
  heroCtaPrimary: z.string().min(1).max(60),
  heroCtaSecondary: z.string().min(1).max(60),
  stepsTitle: z.string().min(1).max(120),
  steps: z.array(stepSchema).length(3),
  blogTitle: z.string().min(1).max(120),
  blogSubtitle: z.string().min(1).max(200),
  newsletterTitle: z.string().min(1).max(120),
  newsletterSubtitle: z.string().min(1).max(300),
  finalCtaTitle: z.string().min(1).max(120),
  finalCtaSubtitle: z.string().min(1).max(300),
  finalCtaButton: z.string().min(1).max(60),
  footerNewsletterTitle: z.string().min(1).max(120),
  footerNewsletterSubtitle: z.string().min(1).max(300),
});

export type HomepageContentActionState = { error: string | null; success: boolean };

function parseHomepageForm(formData: FormData) {
  const steps = [0, 1, 2].map((index) => ({
    number: formData.get(`step${index}Number`),
    title: formData.get(`step${index}Title`),
    body: formData.get(`step${index}Body`),
  }));

  return homepageSchema.safeParse({
    heroBadge: formData.get("heroBadge"),
    heroTitle: formData.get("heroTitle"),
    heroSubtitle: formData.get("heroSubtitle"),
    heroCtaPrimary: formData.get("heroCtaPrimary"),
    heroCtaSecondary: formData.get("heroCtaSecondary"),
    stepsTitle: formData.get("stepsTitle"),
    steps,
    blogTitle: formData.get("blogTitle"),
    blogSubtitle: formData.get("blogSubtitle"),
    newsletterTitle: formData.get("newsletterTitle"),
    newsletterSubtitle: formData.get("newsletterSubtitle"),
    finalCtaTitle: formData.get("finalCtaTitle"),
    finalCtaSubtitle: formData.get("finalCtaSubtitle"),
    finalCtaButton: formData.get("finalCtaButton"),
    footerNewsletterTitle: formData.get("footerNewsletterTitle"),
    footerNewsletterSubtitle: formData.get("footerNewsletterSubtitle"),
  });
}

export async function updateHomepageContentAction(
  _prev: HomepageContentActionState,
  formData: FormData,
): Promise<HomepageContentActionState> {
  await requireAdmin();
  const tErrors = await getTranslations("admin.errors");

  const parsed = parseHomepageForm(formData);
  if (!parsed.success) {
    return {
      error: tErrors("invalidData"),
      success: false,
    };
  }

  await connectToDatabase();

  await SiteContentModel.findOneAndUpdate(
    { key: "homepage" },
    { key: "homepage", ...parsed.data },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );

  revalidatePath("/");
  revalidatePath("/admin/site");
  revalidateTag(HOMEPAGE_CONTENT_TAG, "max");

  return { error: null, success: true };
}

export async function resetHomepageContentAction(
): Promise<HomepageContentActionState> {
  await requireAdmin();
  await connectToDatabase();

  await SiteContentModel.findOneAndUpdate(
    { key: "homepage" },
    { key: "homepage", ...DEFAULT_HOMEPAGE_CONTENT },
    { upsert: true, returnDocument: "after" },
  );

  revalidatePath("/");
  revalidatePath("/admin/site");
  revalidateTag(HOMEPAGE_CONTENT_TAG, "max");

  return { error: null, success: true };
}
