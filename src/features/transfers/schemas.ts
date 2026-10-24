import { z } from "zod";

type TransferValidationKey =
  | "selectSourceAccount"
  | "selectDestinationAccount"
  | "amountPositive"
  | "dateInvalid"
  | "transferAccountsMustDiffer";

type ValidationTranslator = (key: TransferValidationKey) => string;

export function createTransferSchema(t: ValidationTranslator) {
  return z
    .object({
      workspaceId: z.string().min(1),
      fromAccountId: z.string().min(1, t("selectSourceAccount")),
      toAccountId: z.string().min(1, t("selectDestinationAccount")),
      amount: z.coerce.number().positive(t("amountPositive")),
      transferDate: z.coerce.date({ message: t("dateInvalid") }),
      description: z.string().trim().max(140).optional().default(""),
      notes: z.string().trim().max(1000).optional().default(""),
      idempotencyKey: z.string().trim().min(1).max(64),
    })
    .refine((data) => data.fromAccountId !== data.toAccountId, {
      message: t("transferAccountsMustDiffer"),
      path: ["toAccountId"],
    });
}

export type CreateTransferInput = z.infer<ReturnType<typeof createTransferSchema>>;
