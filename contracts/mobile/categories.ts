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

/** PATCH /api/mobile/categories — same `categoriesService.update` / `archive` the web uses (custom categories only). */
export const mobileCategoryPatchBodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("archive"),
    workspaceId: z.string().min(1),
    categoryId: z.string().min(1),
  }),
  z.object({
    action: z.literal("update"),
    workspaceId: z.string().min(1),
    categoryId: z.string().min(1),
    name: z.string(),
    nameEn: z.string().optional(),
  }),
]);
export type MobileCategoryPatchBody = z.infer<typeof mobileCategoryPatchBodySchema>;
