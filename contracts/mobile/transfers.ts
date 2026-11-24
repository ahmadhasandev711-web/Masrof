import { z } from "zod";
import { mobilePageSchema } from "./common";

export const mobileTransferSchema = z.object({
  id: z.string(),
  amount: z.number(),
  transferDate: z.string().optional(),
  description: z.string().optional(),
  fromAccountName: z.string().optional(),
  toAccountName: z.string().optional(),
  /** Resolved account currency — both sides of a transfer are the same. */
  currency: z.string().optional(),
});

export type MobileTransfer = z.infer<typeof mobileTransferSchema>;

export const mobileTransfersListResponseSchema = mobilePageSchema(mobileTransferSchema);
export type MobileTransfersListResponse = z.infer<typeof mobileTransfersListResponseSchema>;

/** PATCH /api/mobile/transfers — same `transfersService.archive` the web uses. */
export const mobileTransferPatchBodySchema = z.object({
  action: z.literal("archive"),
  workspaceId: z.string().min(1),
  transferId: z.string().min(1),
});
export type MobileTransferPatchBody = z.infer<typeof mobileTransferPatchBodySchema>;
