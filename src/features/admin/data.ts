import "server-only";

import { connectToDatabase } from "@/lib/db/mongoose";
import { PostModel } from "@/models/post";
import { SubscriberModel } from "@/models/subscriber";
import { mongoDb } from "@/lib/db/mongo-client";

export async function listAllPosts() {
  await connectToDatabase();
  return PostModel.find({})
    .select("title slug locale excerpt isPublished publishedAt featuredImage createdAt updatedAt")
    .sort({ updatedAt: -1 })
    .lean();
}

export async function getPostById(id: string) {
  await connectToDatabase();
  return PostModel.findById(id).lean();
}

export async function getAdminStats() {
  await connectToDatabase();

  const [postsTotal, postsPublished, subscribersActive, usersTotal] = await Promise.all([
    PostModel.countDocuments({}),
    PostModel.countDocuments({ isPublished: true }),
    SubscriberModel.countDocuments({ status: "active" }),
    mongoDb.collection("user").countDocuments({}),
  ]);

  return { postsTotal, postsPublished, subscribersActive, usersTotal };
}

export async function listAppUsers(limit = 100) {
  const users = await mongoDb
    .collection("user")
    .find({})
    .project({ name: 1, email: 1, emailVerified: 1, createdAt: 1, image: 1 })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  const mapped = users.map((user) => ({
    id: String(user._id),
    name: (user.name as string | undefined) ?? "—",
    email: user.email as string,
    emailVerified: Boolean(user.emailVerified),
    createdAt: user.createdAt as Date | undefined,
    image: user.image as string | undefined,
  }));

  const { getSubscriptionsForUsers } = await import("@/features/subscriptions/data");
  const subscriptions = await getSubscriptionsForUsers(mapped.map((u) => u.id));

  return mapped.map((user) => ({
    ...user,
    subscription: subscriptions.get(user.id) ?? {
      plan: "free" as const,
      status: "active" as const,
      expiresAt: null,
      isSuspended: false,
    },
  }));
}

export async function listSubscribers() {
  await connectToDatabase();
  return SubscriberModel.find({}).sort({ createdAt: -1 }).lean();
}
