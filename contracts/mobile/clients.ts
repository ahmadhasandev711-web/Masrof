import { z } from "zod";
import { mobileListSchema } from "./common";

export const mobileClientSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  projectCount: z.number().int().nonnegative().optional(),
  invoicedTotal: z.number().optional(),
  paidTotal: z.number().optional(),
  outstandingBalance: z.number().optional(),
});

export type MobileClient = z.infer<typeof mobileClientSchema>;

export const mobileClientsListResponseSchema = mobileListSchema(mobileClientSchema);
export type MobileClientsListResponse = z.infer<typeof mobileClientsListResponseSchema>;

export const mobileClientCreatedSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
});

export type MobileClientCreated = z.infer<typeof mobileClientCreatedSchema>;
