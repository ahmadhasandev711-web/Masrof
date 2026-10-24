import { z } from "zod";
import { idempotencyKeyField } from "@/lib/idempotency/fields";
import { CATEGORY_KINDS } from "@/models/category";

type CategoryValidationKey =
  | "categoryNameMin2"
  | "categoryNameEnMin2"
  | "categoryKindInvalid";

type ValidationTranslator = (key: CategoryValidationKey) => string;

export function createCategorySchema(t: ValidationTranslator) {
  return z.object({
    workspaceId: z.string().min(1),
    name: z.string().trim().min(2, t("categoryNameMin2")).max(60),
    nameEn: z.preprocess(
      (val) => {
        if (val == null || val === "") return undefined;
        const s = String(val).trim();
        return s.length === 0 ? undefined : s;
      },
      z.string().min(2, t("categoryNameEnMin2")).max(60).optional(),
    ),
    kind: z.enum(CATEGORY_KINDS, { message: t("categoryKindInvalid") }),
    idempotencyKey: idempotencyKeyField,
  });
}

export type CreateCategoryInput = z.infer<ReturnType<typeof createCategorySchema>>;
