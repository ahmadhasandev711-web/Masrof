import { z } from "zod";
import { isValidPhoneNumber } from "@/lib/phone";

type RegisterValidationKey =
  | "nameMin2"
  | "emailInvalid"
  | "phoneRequired"
  | "phoneInvalid"
  | "passwordMin8";

type LoginValidationKey =
  | "identifierRequired"
  | "identifierInvalid"
  | "passwordRequired";

type ValidationTranslator = (
  key: RegisterValidationKey | LoginValidationKey,
) => string;

export function createRegisterSchema(t: ValidationTranslator) {
  return z.object({
    name: z.string().trim().min(2, t("nameMin2")),
    email: z.email(t("emailInvalid")),
    phoneNumber: z
      .string()
      .trim()
      .min(1, t("phoneRequired"))
      .refine((val) => isValidPhoneNumber(val), {
        message: t("phoneInvalid"),
      }),
    password: z.string().min(8, t("passwordMin8")),
  });
}

export function createLoginSchema(t: ValidationTranslator) {
  return z.object({
    identifier: z
      .string()
      .trim()
      .min(1, t("identifierRequired"))
      .refine((val) => val.includes("@") ? z.email().safeParse(val).success : isValidPhoneNumber(val), {
        message: t("identifierInvalid"),
      }),
    password: z.string().min(1, t("passwordRequired")),
  });
}

export type RegisterInput = z.infer<ReturnType<typeof createRegisterSchema>>;
export type LoginInput = z.infer<ReturnType<typeof createLoginSchema>>;
