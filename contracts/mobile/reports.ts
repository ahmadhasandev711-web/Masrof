import { z } from "zod";

export const mobileReportsResponseSchema = z
  .object({
    preset: z.string(),
    range: z.unknown(),
    summary: z.unknown(),
    expenseBreakdown: z.unknown(),
    incomeBreakdown: z.unknown(),
    trend: z.unknown(),
    currency: z.string(),
  })
  .passthrough();

export type MobileReportsResponse = z.infer<typeof mobileReportsResponseSchema>;
