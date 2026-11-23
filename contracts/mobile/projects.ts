import { z } from "zod";
import { mobileListSchema } from "./common";
import { mobileQuantityUsageSchema } from "./invoices";

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

export const mobileProjectsListResponseSchema = mobileListSchema(mobileProjectSchema).extend({
  /** maxActiveProjects meter, same as the web projects page. */
  usage: mobileQuantityUsageSchema.optional(),
});
export type MobileProjectsListResponse = z.infer<typeof mobileProjectsListResponseSchema>;

export const mobileProjectCreatedSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
});

export type MobileProjectCreated = z.infer<typeof mobileProjectCreatedSchema>;

/** PATCH /api/mobile/projects — projectsService.updateStatus / archive. */
export const mobileProjectPatchBodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("status"),
    workspaceId: z.string().min(1),
    projectId: z.string().min(1),
    status: z.string(),
  }),
  z.object({ action: z.literal("archive"), workspaceId: z.string().min(1), projectId: z.string().min(1) }),
]);
export type MobileProjectPatchBody = z.infer<typeof mobileProjectPatchBodySchema>;

/** GET /api/mobile/projects/[id] — the web's project financial details. */
export const mobileProjectDetailsResponseSchema = z.object({
  project: z.object({
    id: z.string(),
    name: z.string(),
    status: z.string(),
    expectedAmount: z.number().nullable(),
    dueDate: z.string().nullable(),
    description: z.string(),
    createdAt: z.string(),
  }),
  client: z
    .object({ id: z.string(), name: z.string(), email: z.string().nullable(), phone: z.string().nullable() })
    .nullable(),
  summary: z.object({
    expectedAmount: z.number().nullable(),
    invoicedTotal: z.number(),
    incomeTotal: z.number(),
    expenseTotal: z.number(),
    netProfit: z.number(),
    profitMargin: z.number().nullable(),
    isOverBudget: z.boolean(),
    collectionProgressPercent: z.number(),
    budgetBurnPercent: z.number().nullable(),
  }),
  invoices: z.array(
    z.object({
      id: z.string(),
      invoiceNumber: z.string(),
      issueDate: z.string(),
      dueDate: z.string().nullable(),
      total: z.number(),
      paidAmount: z.number(),
      remainingAmount: z.number(),
      status: z.string(),
      financialStatus: z.string(),
    }),
  ),
  transactions: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["income", "expense"]),
      amount: z.number(),
      transactionDate: z.string(),
      description: z.string(),
      categoryName: z.string(),
      accountName: z.string(),
    }),
  ),
});
export type MobileProjectDetailsResponse = z.infer<typeof mobileProjectDetailsResponseSchema>;
