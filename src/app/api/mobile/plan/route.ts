import { NextResponse } from "next/server";
import { getWorkspacePlanContext } from "@/features/subscriptions/data";
import { getMobileEntitlements } from "@/features/subscriptions/mobile-entitlements";
import {
  mobileErrorResponse,
  requireMobileSession,
  requireMobileWorkspace,
} from "@/lib/mobile/session";

export async function GET(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  const access = await requireMobileWorkspace(session.user.id, workspaceId, "read");
  if (access instanceof NextResponse) return access;

  try {
    const [context, entitlements] = await Promise.all([
      getWorkspacePlanContext(session.user.id, access.workspaceId),
      getMobileEntitlements(session.user.id, access.workspaceId),
    ]);

    return NextResponse.json({
      plan: entitlements.plan,
      showAds: entitlements.showAds,
      isSuspended: entitlements.isSuspended || context.subscription.isSuspended,
      status: context.subscription.status,
      expiresAt: context.subscription.expiresAt ?? null,
      planName: context.plan.name,
      features: context.plan.features,
    });
  } catch (error) {
    return mobileErrorResponse(error);
  }
}
