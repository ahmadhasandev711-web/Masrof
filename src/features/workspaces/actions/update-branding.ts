"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/features/auth/session";
import { requireWorkspaceOwner } from "@/features/workspaces/access";
import { updateWorkspaceBrandingSchema } from "@/features/workspaces/branding-schema";
import { updateWorkspace } from "@/features/workspaces/data";

export type UpdateBrandingState = { error: string | null; success?: boolean };

export async function updateWorkspaceBrandingAction(
  _prev: UpdateBrandingState,
  formData: FormData,
): Promise<UpdateBrandingState> {
  const session = await requireSession();
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

  await requireWorkspaceOwner(session.user.id, parsed.data.workspaceId);

  await updateWorkspace(parsed.data.workspaceId, {
    businessName: parsed.data.businessName ?? "",
    logoUrl: parsed.data.logoUrl ?? "",
    taxId: parsed.data.taxId ?? "",
    businessPhone: parsed.data.businessPhone ?? "",
    businessAddress: parsed.data.businessAddress ?? "",
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/invoices");
  return { error: null, success: true };
}
