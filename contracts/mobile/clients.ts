import { z } from "zod";
import { mobileListSchema } from "./common";
import { mobileQuantityUsageSchema } from "./invoices";

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

export const mobileClientsListResponseSchema = mobileListSchema(mobileClientSchema).extend({
  /** maxClients meter, same as the web clients page. */
  usage: mobileQuantityUsageSchema.optional(),
});
export type MobileClientsListResponse = z.infer<typeof mobileClientsListResponseSchema>;

export const mobileClientCreatedSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
});

export type MobileClientCreated = z.infer<typeof mobileClientCreatedSchema>;

/** PATCH /api/mobile/clients — clientsService.update / archive, like the web actions. */
export const mobileClientPatchBodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("update"),
    workspaceId: z.string().min(1),
    clientId: z.string().min(1),
    name: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
  }),
  z.object({ action: z.literal("archive"), workspaceId: z.string().min(1), clientId: z.string().min(1) }),
]);
export type MobileClientPatchBody = z.infer<typeof mobileClientPatchBodySchema>;

/** GET /api/mobile/clients/[id] — the web's client statement (ledger with running balance). */
export const mobileStatementEntrySchema = z.object({
  id: z.string(),
  date: z.string(),
  type: z.enum(["invoice", "payment"]),
  numberOrRef: z.string(),
  description: z.string(),
  projectName: z.string().nullable(),
  debit: z.number(),
  credit: z.number(),
  runningBalance: z.number(),
});
export const mobileClientStatementResponseSchema = z.object({
  client: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
  }),
  totalInvoiced: z.number(),
  totalPaid: z.number(),
  currentOutstanding: z.number(),
  entries: z.array(mobileStatementEntrySchema),
});
export type MobileClientStatementResponse = z.infer<typeof mobileClientStatementResponseSchema>;
