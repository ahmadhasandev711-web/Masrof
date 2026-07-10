import { z } from "zod";

type RegisterValidationKey = "nameMin2" | "emailInvalid" | "passwordMin8";
type LoginValidationKey = "emailInvalid" | "passwordRequired";

type ValidationTranslator = (key: RegisterValidationKey | LoginValidationKey) => string;

export function createRegisterSchema(t: ValidationTranslator) {
  return z.object({
    name: z.string().trim().min(2, t("nameMin2")),
    email: z.email(t("emailInvalid")),
    password: z.string().min(8, t("passwordMin8")),
  });
}

export function createLoginSchema(t: ValidationTranslator) {
  return z.object({
    email: z.email(t("emailInvalid")),
    password: z.string().min(1, t("passwordRequired")),
  });
}

export type RegisterInput = z.infer<ReturnType<typeof createRegisterSchema>>;
export type LoginInput = z.infer<ReturnType<typeof createLoginSchema>>;
