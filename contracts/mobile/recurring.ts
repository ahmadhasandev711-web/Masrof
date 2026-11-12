import { z } from "zod";
import { mobileListSchema } from "./common";

export const mobileRecurringSchema = z
  .object({
    id: z.string().optional(),
    _id: z.string().optional(),
    name: z.string().optional(),
    amount: z.number().optional(),
  })
  .passthrough();

export const mobileRecurringListResponseSchema = mobileListSchema(mobileRecurringSchema);
