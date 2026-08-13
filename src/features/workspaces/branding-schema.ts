import { z } from "zod";

export const updateWorkspaceBrandingSchema = z.object({
  workspaceId: z.string().min(1),
  businessName: z.string().trim().max(120).optional(),
  logoUrl: z.string().trim().max(500).optional(),
  taxId: z.string().trim().max(60).optional(),
  businessPhone: z.string().trim().max(30).optional(),
  businessAddress: z.string().trim().max(240).optional(),
});

export type UpdateWorkspaceBrandingInput = z.infer<typeof updateWorkspaceBrandingSchema>;
