import { z } from "zod";
import { mobileListSchema } from "./common";

const minorOrNull = z.number().nullable();

export const mobileBudgetSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: z.number(),
  spent: minorOrNull,
  remaining: minorOrNull,
  percentage: minorOrNull,
  conversionIncomplete: z.boolean(),
  categoryId: z.string().nullable(),
  categoryName: z.string().nullable(),
  categoryIcon: z.string().nullable(),
});

export type MobileBudget = z.infer<typeof mobileBudgetSchema>;

export const mobileBudgetsListResponseSchema = mobileListSchema(mobileBudgetSchema);

/** PATCH /api/mobile/budgets — same `budgetsService.archive` the web uses. */
export const mobileBudgetPatchBodySchema = z.object({
  workspaceId: z.string().min(1),
  budgetId: z.string().min(1),
});
