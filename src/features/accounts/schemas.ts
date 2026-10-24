import { z } from "zod";
import { idempotencyKeyField } from "@/lib/idempotency/fields";
import { ACCOUNT_TYPES } from "@/models/account";
import { SUPPORTED_CURRENCIES } from "@/models/workspace";

type AccountValidationKey = "accountNameMin2" | "accountTypeInvalid" | "openingBalanceInvalid";

type ValidationTranslator = (key: AccountValidationKey) => string;

export function createAccountSchema(t: ValidationTranslator) {
  return z.object({
    workspaceId: z.string().min(1),
    name: z.string().trim().min(2, t("accountNameMin2")).max(60),
    type: z.enum(ACCOUNT_TYPES, { message: t("accountTypeInvalid") }),
    currency: z.enum(SUPPORTED_CURRENCIES).optional(),
    openingBalance: z.coerce
      .number()
      .refine((val) => Number.isFinite(val), t("openingBalanceInvalid"))
      .default(0),
    idempotencyKey: idempotencyKeyField,
  });
}

export const updateAccountSchema = z.object({
  accountId: z.string().min(1),
  workspaceId: z.string().min(1),
  name: z.string().trim().min(2).max(60).optional(),
});

export type CreateAccountInput = z.infer<ReturnType<typeof createAccountSchema>>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
