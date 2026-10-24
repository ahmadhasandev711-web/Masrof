import { z } from "zod";

export const idempotencyKeyField = z.string().trim().min(1).max(64);
