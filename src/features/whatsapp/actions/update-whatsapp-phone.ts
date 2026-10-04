"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getTranslations } from "next-intl/server";
import { requireSession } from "@/features/auth/session";
import { assertPlanFeature } from "@/features/subscriptions/data";
import { setUserWhatsAppPhone } from "@/features/whatsapp/data";
import { normalizeWhatsAppPhone } from "@/lib/whatsapp";
import { UserSettingsModel } from "@/models/user-settings";

export type UpdateWhatsAppPhoneState = { error: string | null; success: boolean };

export async function updateWhatsAppPhoneAction(
  _prev: UpdateWhatsAppPhoneState,
  formData: FormData,
): Promise<UpdateWhatsAppPhoneState> {
  const session = await requireSession();
  const tValidation = await getTranslations("validation");
  const tErrors = await getTranslations("errors");

  const featureError = await assertPlanFeature(session.user.id, "whatsappReminders");
  if (featureError) {
    return { error: featureError, success: false };
  }

  const schema = z.object({
    whatsappPhone: z.string().trim().max(30).optional().default(""),
  });

  const parsed = schema.safeParse({ whatsappPhone: formData.get("whatsappPhone") ?? "" });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? tValidation("phoneInvalid"), success: false };
  }

  const raw = parsed.data.whatsappPhone.trim();
  if (!raw) {
    await setUserWhatsAppPhone(session.user.id, null);
    revalidatePath("/dashboard/plan");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/budgets");
    return { error: null, success: true };
  }

  const normalized = normalizeWhatsAppPhone(raw);
  if (!normalized) {
    return { error: tErrors("whatsappInvalid"), success: false };
  }

  const phoneToSave = raw.trim();
  const existing = await UserSettingsModel.findOne({
    userId: { $ne: session.user.id },
    $or: [{ whatsappPhone: phoneToSave }, { whatsappPhone: normalized }],
  }).lean();

  if (existing) {
    return { error: tValidation("phoneAlreadyUsed"), success: false };
  }

  await setUserWhatsAppPhone(session.user.id, phoneToSave);
  revalidatePath("/dashboard/plan");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/budgets");
  revalidatePath("/dashboard/projects");
  return { error: null, success: true };
}
