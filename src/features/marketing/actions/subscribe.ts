"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getTranslations } from "next-intl/server";
import { connectToDatabase } from "@/lib/db/mongoose";
import { SubscriberModel } from "@/models/subscriber";
import { sendNewsletterWelcomeNotification } from "@/features/notifications/dispatch";

export type SubscribeState = { error: string | null; success: boolean };

export async function subscribeNewsletterAction(
  _prev: SubscribeState,
  formData: FormData,
): Promise<SubscribeState> {
  const tValidation = await getTranslations("validation");
  const tErrors = await getTranslations("errors");

  const newsletterSchema = z.object({
    email: z.string().email(tValidation("emailRequired")),
  });

  const parsed = newsletterSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData"), success: false };
  }

  await connectToDatabase();

  const existing = await SubscriberModel.findOne({ email: parsed.data.email }).lean();
  if (existing?.status === "active") {
    return { error: null, success: true };
  }

  if (existing) {
    await SubscriberModel.updateOne({ _id: existing._id }, { status: "active" });
  } else {
    await SubscriberModel.create({ email: parsed.data.email, source: "website" });
  }

  await sendNewsletterWelcomeNotification(parsed.data.email);

  revalidatePath("/admin/subscribers");
  return { error: null, success: true };
}
