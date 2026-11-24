import { NextResponse } from "next/server";
import { getEffectiveSubscriptionForWorkspace } from "@/features/subscriptions/data";
import { getLocalizedPlanFromConfig } from "@/features/subscriptions/plan-config-data";
import { getMobileEntitlements } from "@/features/subscriptions/mobile-entitlements";
import { proPricePhrase, proUpgradeWhatsappText } from "@/features/subscriptions/pro-pricing";
import { getSupportConfig } from "@/lib/support";
import type { AppLocale } from "@/i18n/config";
import { requireMobileSession, requireMobileWorkspace } from "@/lib/mobile/session";
import { mobilePlanResponseSchema } from "@contracts/mobile/entitlements";
import { thrownToMobileResponse } from "@/server/kernel";

export async function GET(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  const locale: AppLocale = url.searchParams.get("locale") === "en" ? "en" : "ar";
  const access = await requireMobileWorkspace(session.user.id, workspaceId, "read");
  if (access instanceof NextResponse) return access;

  try {
    const [subscription, entitlements] = await Promise.all([
      getEffectiveSubscriptionForWorkspace(session.user.id, access.workspaceId),
      getMobileEntitlements(session.user.id, access.workspaceId),
    ]);
    const plan = await getLocalizedPlanFromConfig(subscription.plan, locale);
    const status =
      subscription.status === "cancelled" || subscription.status === "suspended"
        ? subscription.status
        : "active";

    return NextResponse.json(
      mobilePlanResponseSchema.parse({
        plan: entitlements.plan,
        showAds: entitlements.showAds,
        isSuspended: entitlements.isSuspended || subscription.isSuspended,
        status,
        expiresAt: subscription.expiresAt
          ? new Date(subscription.expiresAt).toISOString()
          : null,
        planName: plan.name,
        features: plan.features,
        proPrice: proPricePhrase(locale),
        upgradeWhatsappUrl: getSupportConfig(proUpgradeWhatsappText("EGP", locale)).whatsappUrl,
      }),
    );
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}
