import { z } from "zod";
import { mobileListSchema } from "./common";

export const mobileBudgetSchema = z.object({
  id: z.string(),
  name: z.string(),
  amount: z.number(),
  spent: z.number(),
  remaining: z.number(),
  percentage: z.number(),
  categoryId: z.string().nullable(),
});

export type MobileBudget = z.infer<typeof mobileBudgetSchema>;

export const mobileBudgetsListResponseSchema = mobileListSchema(mobileBudgetSchema);
