import { z } from "zod";

const minorAmount = z.number().nullable();

const conversionSchema = z.object({
  missingRates: z.array(z.string()),
  canConvertAll: z.boolean(),
});

const categoryRowSchema = z.object({
  categoryId: z.string(),
  name: z.string(),
  icon: z.string().nullable(),
  total: minorAmount,
});

const breakdownSchema = conversionSchema.extend({
  rows: z.array(categoryRowSchema),
});

/** Same numbers as the web reports page. Amounts stay in minor units. */
export const mobileReportsResponseSchema = z.object({
  preset: z.string(),
  range: z.object({
    from: z.string().nullable(),
    to: z.string().nullable(),
  }),
  summary: conversionSchema.extend({
    income: minorAmount,
    expense: minorAmount,
    net: minorAmount,
  }),
  expenseBreakdown: breakdownSchema,
  incomeBreakdown: breakdownSchema,
  trend: conversionSchema.extend({
    months: z.array(
      z.object({
        label: z.string(),
        year: z.number().int(),
        month: z.number().int(),
        income: minorAmount,
        expense: minorAmount,
      }),
    ),
  }),
  currency: z.string(),
});

export type MobileReportsResponse = z.infer<typeof mobileReportsResponseSchema>;
