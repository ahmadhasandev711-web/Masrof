import { z } from "zod";
import { idempotencyKeyField } from "@/lib/idempotency/fields";

type BudgetValidationKey = "budgetNameMin2" | "budgetAmountPositive";

type ValidationTranslator = (key: BudgetValidationKey) => string;

export function createBudgetSchema(t: ValidationTranslator) {
  return z.object({
    workspaceId: z.string().min(1),
    name: z.string().trim().min(2, t("budgetNameMin2")).max(60),
    categoryId: z.string().optional(),
    amount: z.coerce.number().positive(t("budgetAmountPositive")),
    idempotencyKey: idempotencyKeyField,
  });
}

export type CreateBudgetInput = z.infer<ReturnType<typeof createBudgetSchema>>;
