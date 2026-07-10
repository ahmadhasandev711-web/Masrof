"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { connectToDatabase } from "@/lib/db/mongoose";
import { SubscriberModel } from "@/models/subscriber";

export async function unsubscribeSubscriberAction(subscriberId: string) {
  await requireAdmin();
  await connectToDatabase();
  await SubscriberModel.findByIdAndUpdate(subscriberId, { status: "unsubscribed" });
  revalidatePath("/admin/subscribers");
}
