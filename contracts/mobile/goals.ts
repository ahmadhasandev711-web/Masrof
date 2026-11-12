import { z } from "zod";
import { mobileListSchema } from "./common";

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

export const mobileGoalsListResponseSchema = mobileListSchema(mobileGoalSchema);
