import "server-only";

import { connectToDatabase } from "@/lib/db/mongoose";
import { EmailNotificationLogModel } from "@/models/email-notification-log";

export async function markNotificationSent(dedupeKey: string, userId: string | null, type: string) {
  await connectToDatabase();
  await EmailNotificationLogModel.create({
    dedupeKey,
    userId,
    notificationType: type,
    sentAt: new Date(),
  });
}

export async function wasNotificationSent(dedupeKey: string): Promise<boolean> {
  await connectToDatabase();
  const existing = await EmailNotificationLogModel.findOne({ dedupeKey }).lean();
  return Boolean(existing);
}

export function dailyDedupeKey(parts: string[]) {
  const day = new Date().toISOString().slice(0, 10);
  return [...parts, day].join(":");
}
