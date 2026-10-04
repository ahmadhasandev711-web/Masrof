"use server";

import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { requireAdmin } from "@/lib/admin";
import { mongoDb } from "@/lib/db/mongo-client";
import { auth } from "@/lib/auth";
import { WorkspaceMembershipModel } from "@/models/workspace-membership";
import { UserSubscriptionModel } from "@/models/user-subscription";
import { WorkspaceModel } from "@/models/workspace";
import { setUserPlan } from "@/features/subscriptions/data";

export type AdminOpResult = {
  error: string | null;
  success: boolean;
  message?: string;
  resetLink?: string;
};

function getUserQuery(userId: string) {
  return mongoose.Types.ObjectId.isValid(userId)
    ? { $or: [{ _id: new mongoose.Types.ObjectId(userId) }, { id: userId }] }
    : { id: userId };
}

/**
 * Manually marks a user's email as verified in better-auth.
 * Essential for customer support when verification emails fail or are delayed.
 */
export async function adminVerifyUserEmailAction(userId: string): Promise<AdminOpResult> {
  await requireAdmin();

  try {
    const filter = getUserQuery(userId);
    const result = await mongoDb.collection("user").updateOne(filter, {
      $set: { emailVerified: true, updatedAt: new Date() },
    });

    if (result.matchedCount === 0) {
      return { error: "المستخدم غير موجود", success: false };
    }

    revalidatePath("/admin/users");
    revalidatePath("/admin");
    return { error: null, success: true };
  } catch (err) {
    console.error("[admin] verify email failed:", err);
    return { error: "فشل تفعيل البريد الإلكتروني", success: false };
  }
}

/**
 * Triggers a password reset request for a user via better-auth.
 */
export async function adminTriggerPasswordResetAction(userId: string): Promise<AdminOpResult> {
  await requireAdmin();

  try {
    const filter = getUserQuery(userId);
    const user = await mongoDb.collection("user").findOne(filter);

    if (!user || !user.email) {
      return { error: "البريد الإلكتروني للمستخدم غير موجود", success: false };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // Call better-auth request password reset API
    await auth.api.requestPasswordReset({
      body: {
        email: user.email as string,
        redirectTo: `${appUrl}/reset-password`,
      },
    });

    return { error: null, success: true, message: "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريد المستخدم" };
  } catch (err) {
    console.error("[admin] trigger password reset failed:", err);
    return { error: "فشل إرسال رابط إعادة تعيين كلمة المرور", success: false };
  }
}

/**
 * Updates a user's display name or email address in better-auth.
 */
export async function adminEditUserInfoAction(
  userId: string,
  input: { name: string; email: string },
): Promise<AdminOpResult> {
  await requireAdmin();

  if (!input.name.trim() || !input.email.trim()) {
    return { error: "الاسم والبريد الإلكتروني مطلوبان", success: false };
  }

  try {
    const filter = getUserQuery(userId);
    
    // Check if new email is already taken by another account
    const existing = await mongoDb.collection("user").findOne({
      email: input.email.trim().toLowerCase(),
      _id: { $ne: mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : undefined },
    });

    if (existing && String(existing._id) !== userId && existing.id !== userId) {
      return { error: "هذا البريد الإلكتروني مستخدم بالفعل بواسطة حساب آخر", success: false };
    }

    await mongoDb.collection("user").updateOne(filter, {
      $set: {
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        updatedAt: new Date(),
      },
    });

    revalidatePath("/admin/users");
    revalidatePath("/admin/workspaces");
    return { error: null, success: true };
  } catch (err) {
    console.error("[admin] edit user failed:", err);
    return { error: "فشل تعديل بيانات المستخدم", success: false };
  }
}

/**
 * Permanently deletes a user account and unlinks all workspace memberships.
 * Protected against self-deletion by super admin.
 */
export async function adminDeleteUserAction(userId: string): Promise<AdminOpResult> {
  const session = await requireAdmin();

  if (userId === session.user.id) {
    return { error: "لا يمكنك حذف حسابك الشخصي كمسؤول", success: false };
  }

  try {
    const filter = getUserQuery(userId);

    // 1. Remove memberships
    await WorkspaceMembershipModel.deleteMany({ userId });

    // 2. Remove user subscriptions
    await UserSubscriptionModel.deleteMany({ userId });

    // 3. Remove Better-Auth sessions & accounts
    await mongoDb.collection("session").deleteMany({ userId });
    await mongoDb.collection("account").deleteMany({ userId });

    // 4. Remove User record
    await mongoDb.collection("user").deleteOne(filter);

    revalidatePath("/admin/users");
    revalidatePath("/admin/workspaces");
    revalidatePath("/admin");
    return { error: null, success: true };
  } catch (err) {
    console.error("[admin] delete user failed:", err);
    return { error: "فشل حذف حساب المستخدم", success: false };
  }
}

/**
 * Quick extension for user / workspace owner from the users table.
 */
export async function adminQuickExtendUserSubscriptionAction(
  userId: string,
  options: { extendDays?: number; durationMonths?: number },
): Promise<AdminOpResult> {
  const session = await requireAdmin();

  try {
    const { connectToDatabase } = await import("@/lib/db/mongoose");
    await connectToDatabase();

    // Find active workspaces owned by this user
    const ownedWorkspaces = await WorkspaceModel.find({
      ownerId: userId,
      isArchived: false,
    });

    const now = Date.now();
    let durationMs = 0;

    if (options.extendDays) {
      durationMs = options.extendDays * 24 * 60 * 60 * 1000;
    } else if (options.durationMonths) {
      durationMs = options.durationMonths * 30 * 24 * 60 * 60 * 1000;
    } else {
      durationMs = 30 * 24 * 60 * 60 * 1000;
    }

    // Extend each owned workspace and the user subscription
    for (const ws of ownedWorkspaces) {
      const currentExp = ws.planExpiresAt ? new Date(ws.planExpiresAt).getTime() : 0;
      const baseTime = currentExp > now ? currentExp : now;
      const newExpiresAt = new Date(baseTime + durationMs);

      await WorkspaceModel.updateOne(
        { _id: ws._id },
        {
          $set: {
            plan: "pro",
            planStatus: "active",
            planExpiresAt: newExpiresAt,
          },
        },
      );
    }

    // Also update UserSubscriptionModel
    const userSub = await UserSubscriptionModel.findOne({ userId });
    const userExp = userSub?.expiresAt ? new Date(userSub.expiresAt).getTime() : 0;
    const baseTime = userExp > now ? userExp : now;
    const newExpiresAt = new Date(baseTime + durationMs);

    await UserSubscriptionModel.findOneAndUpdate(
      { userId },
      {
        $set: {
          plan: "pro",
          status: "active",
          expiresAt: newExpiresAt,
          isSuspended: false,
          notes: `تمديد سريع بواسطة الأدمن ${session.user.email}`,
        },
      },
      { upsert: true },
    );

    revalidatePath("/admin/users");
    revalidatePath("/admin/workspaces");
    revalidatePath("/admin");
    return { error: null, success: true };
  } catch (err) {
    console.error("[admin] quick extend user failed:", err);
    return { error: "فشل تمديد الاشتراك", success: false };
  }
}
