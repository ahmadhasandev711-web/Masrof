import { z } from "zod";

export const mobileDashboardResponseSchema = z.object({
  workspace: z.object({
    id: z.string(),
    name: z.string(),
    currency: z.string(),
  }),
  totalBalance: z.number(),
  monthIncome: z.number(),
  monthExpense: z.number(),
  monthNet: z.number(),
  canConvertAll: z.boolean(),
  budgetWarnings: z.number().int(),
  dueRecurring: z.number().int(),
  receivableProjects: z.number().int(),
});

export type MobileDashboardResponse = z.infer<typeof mobileDashboardResponseSchema>;
