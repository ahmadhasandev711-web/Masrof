import { z } from "zod";
import { RECURRING_FREQUENCIES } from "@/models/recurring-expense";

type RecurringValidationKey =
  | "selectAccount"
  | "selectCategory"
  | "amountPositive"
  | "frequencyInvalid"
  | "dueDateInvalid"
  | "dayOfMonthRequired"
  | "dayOfWeekRequired";

type ValidationTranslator = (key: RecurringValidationKey) => string;

export function createRecurringExpenseSchema(t: ValidationTranslator) {
  return z
    .object({
      workspaceId: z.string().min(1),
      accountId: z.string().min(1, t("selectAccount")),
      categoryId: z.string().min(1, t("selectCategory")),
      amount: z.coerce.number().positive(t("amountPositive")),
      description: z.string().trim().max(140).optional().default(""),
      frequency: z.enum(RECURRING_FREQUENCIES, { message: t("frequencyInvalid") }),
      dayOfMonth: z.coerce.number().int().min(1).max(28).optional(),
      dayOfWeek: z.coerce.number().int().min(0).max(6).optional(),
      nextDueDate: z.coerce.date({ message: t("dueDateInvalid") }),
    })
    .superRefine((data, ctx) => {
      if (data.frequency === "monthly" && data.dayOfMonth == null) {
        ctx.addIssue({ code: "custom", message: t("dayOfMonthRequired"), path: ["dayOfMonth"] });
      }
      if (data.frequency === "weekly" && data.dayOfWeek == null) {
        ctx.addIssue({ code: "custom", message: t("dayOfWeekRequired"), path: ["dayOfWeek"] });
      }
    });
}

export type CreateRecurringExpenseInput = z.infer<ReturnType<typeof createRecurringExpenseSchema>>;
