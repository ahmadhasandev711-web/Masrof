import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { LOCALES } from "@/i18n/config";

const featuredImageSchema = new Schema(
  {
    url: { type: String, trim: true, default: null },
    alt: { type: String, trim: true, default: null },
  },
  { _id: false },
);

const postSchema = new Schema(
  {
    locale: { type: String, enum: LOCALES, required: true, default: "ar" },
    slug: { type: String, required: true, trim: true, lowercase: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    excerpt: { type: String, required: true, trim: true, maxlength: 300 },
    content: { type: String, required: true },
    featuredImage: { type: featuredImageSchema, default: null },
    category: { type: String, trim: true, maxlength: 40, default: null },
    tags: { type: [String], default: [] },
    isPublished: { type: Boolean, required: true, default: false },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

postSchema.index({ locale: 1, slug: 1 }, { unique: true });
postSchema.index({ isPublished: 1, locale: 1, publishedAt: -1 });
postSchema.index({ isPublished: 1, locale: 1, category: 1, publishedAt: -1 });

export type PostDocument = InferSchemaType<typeof postSchema>;

export const PostModel: Model<PostDocument> = models.Post ?? model<PostDocument>("Post", postSchema);
