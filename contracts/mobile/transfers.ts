import { z } from "zod";
import { mobileListSchema, mobilePageSchema } from "./common";

export const mobileTransferSchema = z.object({
  id: z.string(),
  amount: z.number(),
  transferDate: z.string().optional(),
  fromAccountId: z.string().optional(),
  toAccountId: z.string().optional(),
  notes: z.string().optional(),
});

export type MobileTransfer = z.infer<typeof mobileTransferSchema>;

export const mobileTransfersListResponseSchema = z.union([
  mobileListSchema(mobileTransferSchema),
  mobilePageSchema(mobileTransferSchema),
]);
