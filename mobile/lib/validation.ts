import { z } from "zod";
import { isValidPhoneNumber } from "@/lib/phone";

/**
 * Mobile Validation Layer (Zod)
 * Matches the Web Backend Schemas 1:1 to guarantee consistency,
 * prevent malformed payloads, and catch data errors before network requests.
 */

export const transactionInputSchema = z.object({
  workspaceId: z.string().min(1, "Workspace is required"),
  accountId: z.string().min(1, "Account is required"),
  categoryId: z.string().min(1, "Category is required"),
  type: z.enum(["income", "expense"], {
    message: "Transaction type must be income or expense",
  }),
  amount: z
    .number()
    .positive("Amount must be greater than zero"),
  transactionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  description: z.string().trim().max(140).optional(),
  notes: z.string().trim().max(1000).optional(),
  clientId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  idempotencyKey: z.string().trim().min(1).max(64),
});

export type TransactionInput = z.infer<typeof transactionInputSchema>;

export const invoiceItemInputSchema = z.object({
  description: z.string().trim().min(1, "Description is required").max(200),
  amount: z
    .number()
    .positive("Amount must be greater than zero"),
  quantity: z.number().int().positive().optional().default(1),
  unitPrice: z.number().positive().optional(),
});

export const invoiceInputSchema = z.object({
  workspaceId: z.string().min(1, "Workspace is required"),
  clientId: z.string().min(1, "Client is required"),
  issueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .optional(),
  notes: z.string().trim().max(500).optional(),
  items: z.array(invoiceItemInputSchema).min(1, "At least one item is required"),
  idempotencyKey: z.string().trim().min(1).max(64),
});

export type InvoiceInput = z.infer<typeof invoiceInputSchema>;

export const transferInputSchema = z
  .object({
    workspaceId: z.string().min(1, "Workspace is required"),
    fromAccountId: z.string().min(1, "Source account is required"),
    toAccountId: z.string().min(1, "Destination account is required"),
    amount: z
      .number()
      .positive("Amount must be greater than zero"),
    transferDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
    notes: z.string().trim().max(500).optional(),
    idempotencyKey: z.string().trim().min(1).max(64),
  })
  .refine((data) => data.fromAccountId !== data.toAccountId, {
    message: "Cannot transfer to the same account",
    path: ["toAccountId"],
  });

export type TransferInput = z.infer<typeof transferInputSchema>;

export const accountInputSchema = z.object({
  workspaceId: z.string().min(1, "Workspace is required"),
  name: z.string().trim().min(1, "Account name is required").max(60),
  type: z.string().min(1, "Account type is required"),
  openingBalance: z.number().optional().default(0),
  idempotencyKey: z.string().trim().min(1).max(64),
});

export type AccountInput = z.infer<typeof accountInputSchema>;

export const categoryInputSchema = z.object({
  workspaceId: z.string().min(1, "Workspace is required"),
  name: z.string().trim().min(1, "Category name is required").max(60),
  kind: z.enum(["income", "expense"]),
  idempotencyKey: z.string().trim().min(1).max(64),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;

export const debtInputSchema = z.object({
  workspaceId: z.string().min(1, "Workspace is required"),
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  creditor: z.string().trim().min(2, "Creditor name must be at least 2 characters").max(120),
  amount: z.number().positive("Amount must be greater than zero"),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .optional()
    .nullable(),
  category: z.string().trim().max(80).optional(),
  notes: z.string().trim().max(500).optional(),
  idempotencyKey: z.string().trim().min(1).max(64),
});

export type DebtInput = z.infer<typeof debtInputSchema>;

export const debtPaymentInputSchema = z.object({
  workspaceId: z.string().min(1, "Workspace is required"),
  debtId: z.string().min(1, "Debt is required"),
  accountId: z.string().min(1, "Account is required"),
  amount: z.number().positive("Amount must be greater than zero"),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  reference: z.string().trim().max(100).optional(),
  notes: z.string().trim().max(500).optional(),
  idempotencyKey: z.string().trim().min(1).max(64),
});

export type DebtPaymentInput = z.infer<typeof debtPaymentInputSchema>;

export const registerInputSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Please enter a valid email address"),
  phoneNumber: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .refine((val) => isValidPhoneNumber(val), {
      message: "Please enter a valid phone number",
    }),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type RegisterInput = z.infer<typeof registerInputSchema>;

export const createWorkspaceInputSchema = z.object({
  name: z.string().trim().min(2, "Workspace name must be at least 2 characters").max(60),
  type: z.enum(["personal", "freelance", "business"]),
  currency: z.string().min(3).max(4).default("EGP"),
  initialAccountName: z.string().trim().max(60).optional(),
  initialAccountType: z.string().optional().default("cash"),
  initialAccountBalance: z.number().optional().default(0),
  idempotencyKey: z.string().trim().min(1).max(64),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceInputSchema>;
