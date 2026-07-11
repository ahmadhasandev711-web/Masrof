import "server-only";

import { connectToDatabase } from "@/lib/db/mongoose";
import { EmailNotificationLogModel } from "@/models/email-notification-log";

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
}

/** Atomically claims a send slot. Returns false if another request already sent today. */
export async function tryClaimNotificationSend(
  dedupeKey: string,
  userId: string | null,
  type: string,
): Promise<boolean> {
  await connectToDatabase();

  try {
    await EmailNotificationLogModel.create({
      dedupeKey,
      userId,
      notificationType: type,
      sentAt: new Date(),
    });
    return true;
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return false;
    }
    throw error;
  }
}

export async function markNotificationSent(dedupeKey: string, userId: string | null, type: string) {
  return tryClaimNotificationSend(dedupeKey, userId, type);
}

export async function wasNotificationSent(dedupeKey: string): Promise<boolean> {
  await connectToDatabase();
  const existing = await EmailNotificationLogModel.findOne({ dedupeKey }).lean();
  return Boolean(existing);
}

export async function releaseNotificationClaim(dedupeKey: string) {
  await connectToDatabase();
  await EmailNotificationLogModel.deleteOne({ dedupeKey });
}

export function dailyDedupeKey(parts: string[]) {
  const day = new Date().toISOString().slice(0, 10);
  return [...parts, day].join(":");
}
