"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { updateWorkspaceBrandingSchema } from "@/features/workspaces/branding-schema";
import { workspacesService } from "@/features/workspaces/workspaces.service";
import { runWorkspaceOwnerWrite } from "@/server/kernel";

export type UpdateBrandingState = { error: string | null; success?: boolean };

export async function updateWorkspaceBrandingAction(
  _prev: UpdateBrandingState,
  formData: FormData,
): Promise<UpdateBrandingState> {
  const tErrors = await getTranslations("errors");

  const parsed = updateWorkspaceBrandingSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    businessName: formData.get("businessName") ?? "",
    logoUrl: formData.get("logoUrl") ?? "",
    taxId: formData.get("taxId") ?? "",
    businessPhone: formData.get("businessPhone") ?? "",
    businessAddress: formData.get("businessAddress") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData") };
  }

  const result = await runWorkspaceOwnerWrite(parsed.data.workspaceId, () =>
    workspacesService.updateBranding(parsed.data),
  );

  if (!result.ok) {
    return { error: result.error.message };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/invoices");
  return { error: null, success: true };
}
