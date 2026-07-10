import "server-only";

import webpush, { type PushSubscription as WebPushSubscription } from "web-push";
import { connectToDatabase } from "@/lib/db/mongoose";
import { PushSubscriptionModel } from "@/models/push-subscription";

export type StoredPushSubscription = WebPushSubscription;

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
};

function getVapidConfig() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:support@masrofaty.app";

  if (!publicKey || !privateKey) {
    return null;
  }

  return { publicKey, privateKey, subject };
}

export function isPushConfigured() {
  return getVapidConfig() !== null;
}

function configureWebPush() {
  const config = getVapidConfig();
  if (!config) return false;

  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  return true;
}

export async function upsertPushSubscription(input: {
  userId: string;
  subscription: StoredPushSubscription;
  userAgent?: string | null;
}) {
  await connectToDatabase();

  await PushSubscriptionModel.findOneAndUpdate(
    { endpoint: input.subscription.endpoint },
    {
      userId: input.userId,
      endpoint: input.subscription.endpoint,
      subscription: input.subscription,
      userAgent: input.userAgent ?? null,
      lastSeenAt: new Date(),
    },
    { upsert: true, returnDocument: "after" },
  );
}

export async function deletePushSubscription(userId: string, endpoint: string) {
  await connectToDatabase();
  await PushSubscriptionModel.deleteOne({ userId, endpoint });
}

export async function getPushSubscriptionCount(userId: string) {
  await connectToDatabase();
  return PushSubscriptionModel.countDocuments({ userId });
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!configureWebPush()) return { sent: 0, failed: 0, configured: false };

  await connectToDatabase();
  const subscriptions = await PushSubscriptionModel.find({ userId }).lean();
  let sent = 0;
  let failed = 0;

  await Promise.all(
    subscriptions.map(async (record) => {
      try {
        await webpush.sendNotification(
          record.subscription as StoredPushSubscription,
          JSON.stringify({
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-192.png",
            url: "/dashboard",
            ...payload,
          }),
        );
        sent += 1;
      } catch (error) {
        failed += 1;
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await PushSubscriptionModel.deleteOne({ endpoint: record.endpoint });
        } else {
          console.error("[push] send failed:", error);
        }
      }
    }),
  );

  return { sent, failed, configured: true };
}
