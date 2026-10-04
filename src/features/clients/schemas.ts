import { z } from "zod";

type ClientValidationKey = "clientNameMin2";

type ValidationTranslator = (key: ClientValidationKey) => string;

export function createClientSchema(t: ValidationTranslator) {
  return z.object({
    workspaceId: z.string().min(1),
    name: z.string().trim().min(2, t("clientNameMin2")).max(120),
    email: z
      .string()
      .trim()
      .max(120)
      .optional()
      .transform((v) => (v && v.length > 0 ? v : null)),
    phone: z
      .string()
      .trim()
      .max(30)
      .optional()
      .transform((v) => (v && v.length > 0 ? v : null)),
  });
}

export function updateClientSchema(t: ValidationTranslator) {
  return createClientSchema(t).extend({
    clientId: z.string().min(1),
  });
}

export type CreateClientInput = z.infer<ReturnType<typeof createClientSchema>>;
export type UpdateClientInput = z.infer<ReturnType<typeof updateClientSchema>>;
