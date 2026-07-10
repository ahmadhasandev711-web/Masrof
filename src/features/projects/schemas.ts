import { z } from "zod";
import { PROJECT_STATUSES } from "@/features/projects/constants";

type ProjectValidationKey =
  | "projectNameMin2"
  | "projectStatusInvalid"
  | "expectedAmountMin0"
  | "dueDateInvalid";

type ValidationTranslator = (key: ProjectValidationKey) => string;

export function createProjectSchema(t: ValidationTranslator) {
  return z.object({
    workspaceId: z.string().min(1),
    clientId: z
      .string()
      .optional()
      .transform((v) => (v && v.length > 0 ? v : null)),
    name: z.string().trim().min(2, t("projectNameMin2")).max(140),
    status: z.enum(PROJECT_STATUSES, { message: t("projectStatusInvalid") }).default("active"),
    expectedAmount: z.coerce
      .number()
      .min(0, t("expectedAmountMin0"))
      .optional()
      .nullable(),
    dueDate: z.coerce.date({ message: t("dueDateInvalid") }).optional().nullable(),
    description: z
      .string()
      .trim()
      .max(500)
      .optional()
      .transform((v) => v ?? ""),
  });
}

export type CreateProjectInput = z.infer<ReturnType<typeof createProjectSchema>>;
