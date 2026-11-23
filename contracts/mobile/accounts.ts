import { z } from "zod";
import { mobileListSchema } from "./common";

export const mobileAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  currency: z.string().nullable().optional(),
  balance: z.number(),
  /** Minor units — shown in the edit form so a mistyped value can be fixed. */
  openingBalance: z.number().optional(),
});

export type MobileAccount = z.infer<typeof mobileAccountSchema>;

export const mobileAccountsListResponseSchema = mobileListSchema(mobileAccountSchema);
export type MobileAccountsListResponse = z.infer<typeof mobileAccountsListResponseSchema>;

/** PATCH /api/mobile/accounts — same `accountsService.update` / `archive` the web uses. */
export const mobileAccountPatchBodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("archive"),
    workspaceId: z.string().min(1),
    accountId: z.string().min(1),
  }),
  z.object({
    action: z.literal("update"),
    workspaceId: z.string().min(1),
    accountId: z.string().min(1),
    name: z.string(),
    openingBalance: z.coerce.number(),
  }),
]);
export type MobileAccountPatchBody = z.infer<typeof mobileAccountPatchBodySchema>;
