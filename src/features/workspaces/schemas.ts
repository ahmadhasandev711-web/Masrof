import { z } from "zod";
import { WORKSPACE_TYPES } from "@/models/workspace";
import { SUPPORTED_CURRENCIES } from "@/models/workspace";
import { ACCOUNT_TYPES } from "@/models/account";

type WorkspaceValidationKey =
  | "exchangeRatePositive"
  | "workspaceNameMin2"
  | "workspaceTypeInvalid"
  | "accountNameMin2"
  | "accountTypeInvalid"
  | "openingBalanceInvalid";

type ValidationTranslator = (key: WorkspaceValidationKey) => string;

export function createWorkspaceSchema(t: ValidationTranslator) {
  return z.object({
    name: z.string().trim().min(2, t("workspaceNameMin2")).max(80),
    type: z.enum(WORKSPACE_TYPES, { message: t("workspaceTypeInvalid") }),
    currency: z.enum(SUPPORTED_CURRENCIES).default("EGP"),
    initialAccountName: z.string().trim().min(2, t("accountNameMin2")).max(60),
    initialAccountType: z.enum(ACCOUNT_TYPES, { message: t("accountTypeInvalid") }),
    initialAccountBalance: z.coerce
      .number()
      .refine((val) => Number.isFinite(val), t("openingBalanceInvalid"))
      .default(0),
  });
}

export const updateWorkspaceSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().trim().min(2).max(80).optional(),
  currency: z.enum(SUPPORTED_CURRENCIES).optional(),
});

export function createUpdateExchangeRatesSchema(t: ValidationTranslator) {
  const exchangeRateSchema = z.coerce.number().positive(t("exchangeRatePositive")).optional();

  return z.object({
    workspaceId: z.string().min(1),
    rates: z.record(z.enum(SUPPORTED_CURRENCIES), exchangeRateSchema),
  });
}

export type CreateWorkspaceInput = z.infer<ReturnType<typeof createWorkspaceSchema>>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export function createInviteMemberSchema(t: (key: "emailInvalid" | "roleInvalid") => string) {
  return z.object({
    workspaceId: z.string().min(1),
    email: z.string().trim().email(t("emailInvalid")),
    role: z.enum(["member", "viewer"], { message: t("roleInvalid") }).default("member"),
  });
}

export type InviteMemberInput = z.infer<ReturnType<typeof createInviteMemberSchema>>;
