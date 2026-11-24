import { z } from "zod";
import { mobileListSchema } from "./common";
import { mobileQuantityUsageSchema } from "./invoices";

export const mobileRecurringSchema = z.object({
  id: z.string(),
  amount: z.number(),
  description: z.string(),
  frequency: z.enum(["monthly", "weekly"]),
  nextDueDate: z.string(),
  accountName: z.string(),
  categoryName: z.string(),
  categoryNameEn: z.string().nullable(),
  categorySlug: z.string().nullable(),
});

export type MobileRecurring = z.infer<typeof mobileRecurringSchema>;

/** Same list as the budgets page recurring section, plus the plan meter and saved WhatsApp number. */
export const mobileRecurringListResponseSchema = mobileListSchema(mobileRecurringSchema).extend({
  usage: mobileQuantityUsageSchema.optional(),
  whatsappPhone: z.string().nullable(),
});

export const mobileRecurringRecordBodySchema = z.object({
  action: z.literal("record"),
  workspaceId: z.string().min(1),
  recurringId: z.string().min(1),
});

export const mobileRecurringArchiveBodySchema = z.object({
  action: z.literal("archive"),
  workspaceId: z.string().min(1),
  recurringId: z.string().min(1),
});
