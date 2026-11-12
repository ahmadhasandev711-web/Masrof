import { z } from "zod";

/** Stable error envelope for every /api/mobile failure. */
export const mobileErrorSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
});

export type MobileError = z.infer<typeof mobileErrorSchema>;

export const mobileOkSchema = z.object({
  ok: z.literal(true),
});

export type MobileOk = z.infer<typeof mobileOkSchema>;

export const mobileIdSchema = z.object({
  id: z.string().min(1),
});

export type MobileId = z.infer<typeof mobileIdSchema>;

export function mobileListSchema<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
  });
}

export function mobilePageSchema<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    totalPages: z.number().int().positive(),
  });
}

export const workspaceIdQuerySchema = z.object({
  workspaceId: z.string().min(1),
});

export type WorkspaceIdQuery = z.infer<typeof workspaceIdQuerySchema>;

/** Coerce unknown id-like values to string for serializers. */
export function asId(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "_id" in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
}

export function asIsoDate(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return String(value);
}
