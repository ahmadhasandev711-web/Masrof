import { z } from "zod";

export const mobileEntitlementsResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
  }),
  userId: z.string(),
  plan: z.string(),
  showAds: z.boolean(),
  isSuspended: z.boolean(),
  flags: z.record(z.string(), z.boolean()),
  limits: z.object({
    maxInvoicesPerMonth: z.number(),
    maxClients: z.number(),
    maxActiveProjects: z.number(),
    maxWorkspaces: z.number(),
  }),
});

export type MobileEntitlementsResponse = z.infer<typeof mobileEntitlementsResponseSchema>;

export const mobilePlanResponseSchema = z.object({
  plan: z.string(),
  showAds: z.boolean(),
  isSuspended: z.boolean(),
  status: z.string(),
  expiresAt: z.string().nullable(),
  planName: z.string(),
  features: z.record(z.string(), z.unknown()),
});

export type MobilePlanResponse = z.infer<typeof mobilePlanResponseSchema>;
