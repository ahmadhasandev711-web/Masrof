/**
 * Clients & projects rules shared by the web app, `/api/mobile` and the mobile app.
 */
import { z } from "zod";
import { idempotencyKeyField } from "./schemas";

// ── Clients ─────────────────────────────────────────────────────────────────

export type ClientValidationKey = "clientNameMin2";

export function createClientSchema(t: (key: ClientValidationKey) => string) {
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
    idempotencyKey: idempotencyKeyField,
  });
}

/**
 * Editing doesn't create anything, so no idempotency key. (Before this lived in
 * contracts/shared it extended the create schema *with* the key, and the web's
 * edit form never sends one — every client edit failed validation.)
 */
export function updateClientSchema(t: (key: ClientValidationKey) => string) {
  return createClientSchema(t).omit({ idempotencyKey: true }).extend({
    clientId: z.string().min(1),
  });
}

export type CreateClientInput = z.infer<ReturnType<typeof createClientSchema>>;
export type UpdateClientInput = z.infer<ReturnType<typeof updateClientSchema>>;

/** Client list filters (web: ?status=all|with_debt|with_projects). */
export const CLIENT_LIST_FILTERS = ["all", "with_debt", "with_projects"] as const;
export type ClientListFilter = (typeof CLIENT_LIST_FILTERS)[number];

// ── Projects ────────────────────────────────────────────────────────────────

export const PROJECT_STATUSES = ["active", "completed", "on_hold"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type ProjectValidationKey =
  | "projectNameMin2"
  | "projectStatusInvalid"
  | "expectedAmountMin0"
  | "dueDateInvalid";

export function createProjectSchema(t: (key: ProjectValidationKey) => string) {
  return z.object({
    workspaceId: z.string().min(1),
    clientId: z
      .string()
      .optional()
      .transform((v) => (v && v.length > 0 ? v : null)),
    name: z.string().trim().min(2, t("projectNameMin2")).max(140),
    status: z.enum(PROJECT_STATUSES, { message: t("projectStatusInvalid") }).default("active"),
    expectedAmount: z.coerce.number().min(0, t("expectedAmountMin0")).optional().nullable(),
    dueDate: z.coerce.date({ message: t("dueDateInvalid") }).optional().nullable(),
    description: z
      .string()
      .trim()
      .max(500)
      .optional()
      .transform((v) => v ?? ""),
    idempotencyKey: idempotencyKeyField,
  });
}

export type CreateProjectInput = z.infer<ReturnType<typeof createProjectSchema>>;

export function updateProjectStatusSchema(t: (key: ProjectValidationKey) => string) {
  return z.object({
    workspaceId: z.string().min(1),
    projectId: z.string().min(1),
    status: z.enum(PROJECT_STATUSES, { message: t("projectStatusInvalid") }),
  });
}

export type UpdateProjectStatusInput = z.infer<ReturnType<typeof updateProjectStatusSchema>>;

// ── Receivables ─────────────────────────────────────────────────────────────

function startOfLocalDay(date: Date | string) {
  const value = new Date(date);
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

/** True when the calendar day is today or within the next `days` days (inclusive). */
export function isOnOrBeforeDaysFromToday(date: Date | string, days: number, now = new Date()) {
  const limit = startOfLocalDay(now);
  limit.setDate(limit.getDate() + days);
  return startOfLocalDay(date).getTime() <= limit.getTime();
}

type ReceivableFields = {
  expectedAmount: number | null;
  paidTotal: number;
  dueDate: string | null;
  clientPhone: string | null;
};

export function projectRemainingAmount(project: Pick<ReceivableFields, "expectedAmount" | "paidTotal">): number {
  if (project.expectedAmount == null) return 0;
  return Math.max(0, project.expectedAmount - project.paidTotal);
}

/** Remind the client on WhatsApp when money is still due within 7 days. */
export function isReceivableReminderDue(project: ReceivableFields): boolean {
  if (projectRemainingAmount(project) <= 0 || !project.dueDate || !project.clientPhone) {
    return false;
  }
  return isOnOrBeforeDaysFromToday(project.dueDate, 7);
}
