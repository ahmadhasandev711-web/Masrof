import { z } from "zod";

type SavingsGoalValidationKey =
  | "goalNameMin2"
  | "targetAmountPositive"
  | "deadlineInvalid"
  | "amountPositive";

type ValidationTranslator = (key: SavingsGoalValidationKey) => string;

export function createSavingsGoalSchema(t: ValidationTranslator) {
  return z.object({
    workspaceId: z.string().min(1),
    name: z.string().trim().min(2, t("goalNameMin2")).max(120),
    targetAmount: z.coerce.number().positive(t("targetAmountPositive")),
    deadline: z
      .preprocess(
        (val) => (val === "" || val == null ? undefined : val),
        z.coerce.date({ message: t("deadlineInvalid") }).optional(),
      ),
  });
}

export function createUpdateGoalProgressSchema(t: ValidationTranslator) {
  return z.object({
    workspaceId: z.string().min(1),
    goalId: z.string().min(1),
    amount: z.coerce.number().positive(t("amountPositive")),
  });
}

export type CreateSavingsGoalInput = z.infer<ReturnType<typeof createSavingsGoalSchema>>;
export type UpdateGoalProgressInput = z.infer<ReturnType<typeof createUpdateGoalProgressSchema>>;
