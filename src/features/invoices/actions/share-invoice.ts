"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import {
  getOrCreateInvoiceShareToken,
  regenerateInvoiceShareToken,
  toggleInvoiceShareable,
} from "@/features/invoices/public-invoice-data";
import { CACHE_TAGS } from "@/lib/cache-tags";

export async function getOrCreateShareTokenAction(
  invoiceId: string,
  workspaceId: string,
): Promise<{ success: boolean; token: string | null; error: string | null }> {
  try {
    const session = await requireSession();
    await verifyWorkspaceWriteAccess(session.user.id, workspaceId);

    const token = await getOrCreateInvoiceShareToken(invoiceId, workspaceId);
    if (!token) {
      return { success: false, token: null, error: "تعذر توليد رابط المشاركة" };
    }

    revalidateTag(CACHE_TAGS.invoices, "max");
    revalidatePath("/dashboard/invoices");

    return { success: true, token, error: null };
  } catch (error) {
    return {
      success: false,
      token: null,
      error: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
    };
  }
}

export async function regenerateShareTokenAction(
  invoiceId: string,
  workspaceId: string,
): Promise<{ success: boolean; token: string | null; error: string | null }> {
  try {
    const session = await requireSession();
    await verifyWorkspaceWriteAccess(session.user.id, workspaceId);

    const token = await regenerateInvoiceShareToken(invoiceId, workspaceId);
    if (!token) {
      return { success: false, token: null, error: "تعذر تجديد رابط المشاركة" };
    }

    revalidateTag(CACHE_TAGS.invoices, "max");
    revalidatePath("/dashboard/invoices");

    return { success: true, token, error: null };
  } catch (error) {
    return {
      success: false,
      token: null,
      error: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
    };
  }
}

export async function toggleShareableAction(
  invoiceId: string,
  workspaceId: string,
  isShareable: boolean,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const session = await requireSession();
    await verifyWorkspaceWriteAccess(session.user.id, workspaceId);

    const success = await toggleInvoiceShareable(invoiceId, workspaceId, isShareable);

    revalidateTag(CACHE_TAGS.invoices, "max");
    revalidatePath("/dashboard/invoices");

    return { success, error: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
    };
  }
}
