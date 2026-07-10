import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const homepageStepSchema = new Schema(
  {
    number: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
  },
  { _id: false },
);

const siteContentSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "homepage" },
    heroBadge: { type: String, required: true },
    heroTitle: { type: String, required: true },
    heroSubtitle: { type: String, required: true },
    heroCtaPrimary: { type: String, required: true },
    heroCtaSecondary: { type: String, required: true },
    stepsTitle: { type: String, required: true },
    steps: { type: [homepageStepSchema], required: true },
    blogTitle: { type: String, required: true },
    blogSubtitle: { type: String, required: true },
    newsletterTitle: { type: String, required: true },
    newsletterSubtitle: { type: String, required: true },
    finalCtaTitle: { type: String, required: true },
    finalCtaSubtitle: { type: String, required: true },
    finalCtaButton: { type: String, required: true },
    footerNewsletterTitle: { type: String, required: true },
    footerNewsletterSubtitle: { type: String, required: true },
  },
  { timestamps: true },
);

export type SiteContentDocument = InferSchemaType<typeof siteContentSchema>;

export const SiteContentModel: Model<SiteContentDocument> =
  models.SiteContent ?? model<SiteContentDocument>("SiteContent", siteContentSchema);
