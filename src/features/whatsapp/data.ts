import "server-only";

import { cache } from "react";
import { connectToDatabase } from "@/lib/db/mongoose";
import { UserSettingsModel } from "@/models/user-settings";

export const getUserWhatsAppPhone = cache(async (userId: string): Promise<string | null> => {
  await connectToDatabase();
  const settings = await UserSettingsModel.findOne({ userId }).lean();
  return settings?.whatsappPhone ?? null;
});

export async function setUserWhatsAppPhone(userId: string, phone: string | null) {
  await connectToDatabase();
  await UserSettingsModel.findOneAndUpdate(
    { userId },
    { whatsappPhone: phone },
    { upsert: true, returnDocument: "after" },
  );
}
