import { z } from "zod";
import { mobileListSchema } from "./common";

export const mobileCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  nameEn: z.string().nullable(),
  displayName: z.string().optional(),
  slug: z.string().nullable(),
  kind: z.enum(["income", "expense"]),
  icon: z.string().nullable(),
  isSystem: z.boolean(),
});

export type MobileCategory = z.infer<typeof mobileCategorySchema>;

export const mobileCategoriesListResponseSchema = mobileListSchema(mobileCategorySchema);
export type MobileCategoriesListResponse = z.infer<typeof mobileCategoriesListResponseSchema>;

export const mobileCategoryCreatedSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameEn: z.string().nullable(),
  kind: z.enum(["income", "expense"]),
});

export type MobileCategoryCreated = z.infer<typeof mobileCategoryCreatedSchema>;
