import { z } from "zod";
import { mobileListSchema } from "./common";

export const mobileProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
  expectedAmount: z.number().nullable(),
  dueDate: z.string().nullable(),
  clientId: z.string().nullable(),
  clientName: z.string().nullable(),
  clientPhone: z.string().nullable().optional(),
  paidTotal: z.number().optional(),
  incomeTotal: z.number().optional(),
  expenseTotal: z.number().optional(),
  netProfit: z.number().optional(),
  profitMargin: z.number().nullable().optional(),
  invoicedTotal: z.number().optional(),
  isOverBudget: z.boolean().optional(),
});

export type MobileProject = z.infer<typeof mobileProjectSchema>;

export const mobileProjectsListResponseSchema = mobileListSchema(mobileProjectSchema);
export type MobileProjectsListResponse = z.infer<typeof mobileProjectsListResponseSchema>;

export const mobileProjectCreatedSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
});

export type MobileProjectCreated = z.infer<typeof mobileProjectCreatedSchema>;
