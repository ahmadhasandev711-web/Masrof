import { z } from "zod";
import { CATEGORY_KINDS } from "@/models/category";

type CategoryValidationKey = "categoryNameMin2" | "categoryKindInvalid";

type ValidationTranslator = (key: CategoryValidationKey) => string;

export function createCategorySchema(t: ValidationTranslator) {
  return z.object({
    workspaceId: z.string().min(1),
    name: z.string().trim().min(2, t("categoryNameMin2")).max(60),
    kind: z.enum(CATEGORY_KINDS, { message: t("categoryKindInvalid") }),
  });
}

export type CreateCategoryInput = z.infer<ReturnType<typeof createCategorySchema>>;
