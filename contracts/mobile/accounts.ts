import { z } from "zod";
import { mobileListSchema } from "./common";

export const mobileAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  currency: z.string().nullable().optional(),
  balance: z.number(),
});

export type MobileAccount = z.infer<typeof mobileAccountSchema>;

export const mobileAccountsListResponseSchema = mobileListSchema(mobileAccountSchema);
export type MobileAccountsListResponse = z.infer<typeof mobileAccountsListResponseSchema>;

/** PATCH /api/mobile/accounts — same `accountsService.archive` the web uses. */
export const mobileAccountPatchBodySchema = z.object({
  action: z.literal("archive"),
  workspaceId: z.string().min(1),
  accountId: z.string().min(1),
});
export type MobileAccountPatchBody = z.infer<typeof mobileAccountPatchBodySchema>;
