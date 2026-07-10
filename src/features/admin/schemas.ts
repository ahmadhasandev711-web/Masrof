import { z } from "zod";

/** Accepts absolute URLs or site-relative paths (e.g. /uploads/blog/...). */
export const imageUrlSchema = z
  .string()
  .refine(
    (value) => value === "" || value.startsWith("/") || /^https?:\/\//i.test(value),
    { message: "رابط الصورة غير صالح" },
  );

import { LOCALES } from "@/i18n/config";

export const postFormSchema = z.object({
  locale: z.enum(LOCALES),
  title: z.string().min(3, "العنوان قصير جداً").max(140),
  slug: z
    .string()
    .min(3, "الرابط قصير جداً")
    .max(80)
    .regex(/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u, "الرابط غير صالح"),
  excerpt: z.string().min(10, "المقتطف قصير").max(300),
  content: z.string().min(20, "المحتوى قصير جداً"),
  isPublished: z.boolean(),
  featuredImageUrl: imageUrlSchema.optional().or(z.literal("")),
  featuredImageAlt: z.string().max(120).optional().or(z.literal("")),
  category: z.string().max(40).optional().or(z.literal("")),
  tags: z.string().max(200).optional().or(z.literal("")),
});

export type PostFormInput = z.infer<typeof postFormSchema>;

export const newsletterSchema = z.object({
  email: z.string().email("بريد إلكتروني غير صالح"),
});
