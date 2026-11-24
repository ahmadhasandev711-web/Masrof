import { z } from "zod";
import { mobileListSchema } from "./common";
import { mobileQuantityUsageSchema } from "./invoices";

export const mobileGoalSchema = z.object({
  id: z.string(),
  name: z.string(),
  targetAmount: z.number(),
  currentAmount: z.number(),
  remaining: z.number(),
  percentage: z.number(),
  deadline: z.string().nullable(),
});

export type MobileGoal = z.infer<typeof mobileGoalSchema>;

/** Same list as the goals page, plus the maxSavingsGoals meter. */
export const mobileGoalsListResponseSchema = mobileListSchema(mobileGoalSchema).extend({
  usage: mobileQuantityUsageSchema.optional(),
});

export const mobileGoalArchiveBodySchema = z.object({
  action: z.literal("archive"),
  workspaceId: z.string().min(1),
  goalId: z.string().min(1),
});
