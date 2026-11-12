import { z } from "zod";
import { mobileListSchema } from "./common";

export const mobileWorkspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  currency: z.string(),
  businessName: z.string().nullable(),
  role: z.enum(["owner", "admin", "member", "viewer"]),
});

export type MobileWorkspace = z.infer<typeof mobileWorkspaceSchema>;

export const mobileWorkspacesListResponseSchema = mobileListSchema(mobileWorkspaceSchema).extend({
  activeWorkspaceId: z.string().nullable(),
});

export type MobileWorkspacesListResponse = z.infer<typeof mobileWorkspacesListResponseSchema>;

export const mobileCreateWorkspaceResponseSchema = z.object({
  workspaceId: z.string(),
});

export type MobileCreateWorkspaceResponse = z.infer<typeof mobileCreateWorkspaceResponseSchema>;

export const mobileBrandingSchema = z.object({
  businessName: z.string().nullable(),
  logoUrl: z.string().nullable(),
  taxId: z.string().nullable(),
  businessPhone: z.string().nullable(),
  businessAddress: z.string().nullable(),
});

export type MobileBranding = z.infer<typeof mobileBrandingSchema>;
