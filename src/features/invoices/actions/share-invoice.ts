"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getTranslations } from "next-intl/server";
import { invoicesService } from "@/features/invoices/invoices.service";
import { runWorkspaceWrite } from "@/server/kernel";
import { CACHE_TAGS } from "@/lib/cache-tags";

export async function getOrCreateShareTokenAction(
  invoiceId: string,
  workspaceId: string,
): Promise<{ success: boolean; token: string | null; error: string | null }> {
  const tErrors = await getTranslations("errors");
  try {
    const result = await runWorkspaceWrite(workspaceId, () =>
      invoicesService.getOrCreateShareToken(invoiceId, workspaceId),
    );

    if (!result.ok) {
      return { success: false, token: null, error: tErrors("shareTokenFailed") };
    }

    revalidateTag(CACHE_TAGS.invoices, "max");
    revalidatePath("/dashboard/invoices");

    return { success: true, token: result.value, error: null };
  } catch {
    return {
      success: false,
      token: null,
      error: tErrors("unexpected"),
    };
  }
}

export async function regenerateShareTokenAction(
  invoiceId: string,
  workspaceId: string,
): Promise<{ success: boolean; token: string | null; error: string | null }> {
  const tErrors = await getTranslations("errors");
  try {
    const result = await runWorkspaceWrite(workspaceId, () =>
      invoicesService.regenerateShareToken(invoiceId, workspaceId),
    );

    if (!result.ok) {
      return { success: false, token: null, error: tErrors("shareTokenRegenerateFailed") };
    }

    revalidateTag(CACHE_TAGS.invoices, "max");
    revalidatePath("/dashboard/invoices");

    return { success: true, token: result.value, error: null };
  } catch {
    return {
      success: false,
      token: null,
      error: tErrors("unexpected"),
    };
  }
}

export async function toggleShareableAction(
  invoiceId: string,
  workspaceId: string,
  isShareable: boolean,
): Promise<{ success: boolean; error: string | null }> {
  const tErrors = await getTranslations("errors");
  try {
    const result = await runWorkspaceWrite(workspaceId, () =>
      invoicesService.toggleShareable(invoiceId, workspaceId, isShareable),
    );

    revalidateTag(CACHE_TAGS.invoices, "max");
    revalidatePath("/dashboard/invoices");

    return { success: result.ok ? result.value : false, error: null };
  } catch {
    return {
      success: false,
      error: tErrors("unexpected"),
    };
  }
}
