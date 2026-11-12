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
