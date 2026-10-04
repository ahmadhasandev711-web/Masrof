import Link from "next/link";
import { requireSession } from "@/features/auth/session";
import { getCurrentWorkspaceContext } from "@/features/workspaces/current";
import { getWorkspacePlanContext, getUserSubscription } from "@/features/subscriptions/data";
import { PRICING_PLANS_ORDER, type PlanId } from "@/features/subscriptions/plans";
import { getSupportConfig } from "@/lib/support";
import { getUserWhatsAppPhone } from "@/features/whatsapp/data";
import { UserWhatsAppSettingsForm } from "@/features/whatsapp/components/user-whatsapp-settings-form";
import { PushNotificationSettings } from "@/features/push/components/push-notification-settings";
import { getPushSubscriptionCount } from "@/lib/push";
import { getDateLocale } from "@/i18n/dates";
import type { AppLocale } from "@/i18n/config";
import { getLocale, getTranslations } from "next-intl/server";
import { getLocalizedPlan, getLocalizedPlanLabel } from "@/i18n/plans-localized";

function statusLabel(status: string, isSuspended: boolean, tCore: (key: "active" | "suspended" | "cancelled") => string) {
  if (isSuspended) return { text: tCore("suspended"), className: "text-red-600" };
  if (status === "cancelled") return { text: tCore("cancelled"), className: "text-amber-600" };
  return { text: tCore("active"), className: "text-emerald-700" };
}

export default async function MyPlanPage() {
  const session = await requireSession();
  const { activeWorkspace } = await getCurrentWorkspaceContext(session.user.id);
  const subscription = activeWorkspace
    ? (await getWorkspacePlanContext(session.user.id, activeWorkspace._id.toString())).subscription
    : await getUserSubscription(session.user.id);
  const locale = (await getLocale()) as AppLocale;
  const dateLocale = getDateLocale(locale);
  const tPage = await getTranslations("pages.plan");
  const tDashboard = await getTranslations("dashboard.plan");
  const tPlansPage = await getTranslations("plans.page");
  const tPlans = await getTranslations("plans");
  const tCoreStatus = await getTranslations("status");
  const displayPlanId: PlanId = subscription.plan;
  const plan = await getLocalizedPlan(displayPlanId);
  const status = statusLabel(
    subscription.status,
    subscription.isSuspended,
    (key) => tCoreStatus(key),
  );
  const support = getSupportConfig();
  const DISPLAY_PLANS: PlanId[] = ["free", "pro"];
  const localizedPlans = await Promise.all(DISPLAY_PLANS.map((id) => getLocalizedPlan(id)));
  const localizedPlanLabels = await Promise.all(DISPLAY_PLANS.map((id) => getLocalizedPlanLabel(id)));
  const localizedPlanLabelById = Object.fromEntries(
    DISPLAY_PLANS.map((id, index) => [id, localizedPlanLabels[index]]),
  ) as Record<PlanId, string>;
  const localizedPlanById = Object.fromEntries(
    DISPLAY_PLANS.map((id, index) => [id, localizedPlans[index]]),
  ) as Record<PlanId, Awaited<ReturnType<typeof getLocalizedPlan>>>;
  const [userWhatsAppPhone, pushSubscriptionCount] = await Promise.all([
    getUserWhatsAppPhone(session.user.id),
    getPushSubscriptionCount(session.user.id),
  ]);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">{tPage("title")}</h1>
        <p className="text-sm text-neutral-500">{tPage("subtitle")}</p>
      </div>

      <section className="rounded-2xl border border-[#E4DFD3] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-neutral-500">
              {activeWorkspace ? `${activeWorkspace.name} — ` : ""}
              {tPlansPage("currentPlan")}
            </p>
            <p className="mt-1 text-2xl font-bold text-[#065F46]">{plan.name}</p>
            <p className={`mt-1 text-sm font-medium ${status.className}`}>{tPlansPage("status")} {status.text}</p>
          </div>
          {subscription.expiresAt && subscription.plan !== "free" && (
            <p className="text-sm text-neutral-500">
              {tPlansPage("validUntil")}{" "}
              <time className="font-medium text-neutral-800">
                {new Intl.DateTimeFormat(dateLocale, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }).format(new Date(subscription.expiresAt))}
              </time>
            </p>
          )}
        </div>

        <ul className="mt-6 flex flex-col gap-2 text-sm text-neutral-700">
          {plan.features.map((f) => (
            <li key={f} className="flex gap-2">
              <span className="text-[#065F46]">✓</span>
              {f}
            </li>
          ))}
        </ul>
      </section>

      <section id="whatsapp" className="rounded-2xl border border-[#25D366]/25 bg-[#ECFDF5]/40 p-6">
        <h2 className="text-sm font-semibold text-[#065F46]">{tDashboard("whatsappSection")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#1C1B1A]/70">{tDashboard("whatsappDescription")}</p>
        {plan.whatsappReminders ? (
          <div className="mt-4">
            <UserWhatsAppSettingsForm currentPhone={userWhatsAppPhone} />
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-[#065F46]/15 bg-white/70 p-4 text-sm text-[#1C1B1A]/70">
            {tDashboard("featureGate.whatsapp")}{" "}
            <Link href="/pricing" className="font-medium text-[#065F46] hover:underline">
              {tDashboard("viewPricing")}
            </Link>
            .
          </div>
        )}
      </section>

      <PushNotificationSettings
        canUsePush={plan.pushNotifications}
        vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null}
        initialSubscriptionCount={pushSubscriptionCount}
      />

      {subscription.plan === "free" && (
        <section className="rounded-2xl border border-[#065F46]/15 bg-[#ECFDF5]/50 p-6">
          <h2 className="font-semibold text-[#065F46]">{tDashboard("upgradeSection")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#1C1B1A]/70">{tDashboard("upgradeDescription")}</p>
          <p className="mt-2 text-sm text-[#1C1B1A]/60">{tDashboard("upgradePaymentNote")}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/pricing"
              className="rounded-lg bg-[#065F46] px-4 py-2 text-sm font-medium text-white hover:bg-[#054d3a]"
            >
              {tDashboard("viewPricing")}
            </Link>
            <a
              href={support.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-[#065F46]/30 px-4 py-2 text-sm font-medium text-[#065F46] hover:bg-[#ECFDF5]"
            >
              {tDashboard("whatsappUpgrade")}
            </a>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-800">{tPlansPage("comparePlans")}</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[500px] text-right text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-xs text-neutral-500">
                <th className="py-2.5 font-medium">{tPlansPage("planColumn")}</th>
                <th className="py-2.5 font-medium">{tPlansPage("priceColumn")}</th>
                <th className="py-2.5 font-medium">المميزات الرئيسية</th>
                <th className="py-2.5 text-center font-medium">{tPlansPage("youAreHere")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {DISPLAY_PLANS.map((id: PlanId) => (
                <tr
                  key={id}
                  className={`transition ${displayPlanId === id ? "bg-[#ECFDF5]/50 font-medium" : ""}`}
                >
                  <td className="py-3.5 font-bold text-neutral-900">{localizedPlanLabelById[id]}</td>
                  <td className="py-3.5 font-semibold text-emerald-800">
                    {localizedPlanById[id].priceYearly === 0
                      ? tPlans("free")
                      : `${localizedPlanById[id].priceDisplay} ${localizedPlanById[id].periodDisplay}`}
                  </td>
                  <td className="py-3.5">
                    <ul className="flex flex-col gap-1 text-xs text-neutral-600">
                      {localizedPlanById[id].features.slice(0, 4).map((f) => (
                        <li key={f} className="flex items-center gap-1.5">
                          <span className="font-bold text-emerald-700">✓</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="py-3.5 text-center">
                    {displayPlanId === id ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                        ✓ {tPlansPage("youAreHere")}
                      </span>
                    ) : (
                      <span className="text-neutral-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
