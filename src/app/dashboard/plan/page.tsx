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
import { proPricePhrase } from "@/features/subscriptions/pro-pricing";

function statusLabel(status: string, isSuspended: boolean, tCore: (key: "active" | "suspended" | "cancelled") => string) {
  if (isSuspended) return { text: tCore("suspended"), className: "text-red-600 dark:text-red-400" };
  if (status === "cancelled") return { text: tCore("cancelled"), className: "text-amber-600 dark:text-amber-400" };
  return { text: tCore("active"), className: "text-emerald-700 dark:text-[#34D399]" };
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
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-[#ECEAE4]">{tPage("title")}</h1>
        <p className="text-sm text-neutral-500 dark:text-[#9AA39F]">{tPage("subtitle")}</p>
      </div>

      <section className="rounded-2xl border border-[#E4DFD3] bg-white p-6 shadow-sm dark:border-[#26302C] dark:bg-[#161E1B]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-neutral-500 dark:text-[#9AA39F]">
              {activeWorkspace ? `${activeWorkspace.name} — ` : ""}
              {tPlansPage("currentPlan")}
            </p>
            <p className="mt-1 text-2xl font-bold text-[#065F46] dark:text-[#34D399]">{plan.name}</p>
            <p className={`mt-1 text-sm font-medium ${status.className}`}>{tPlansPage("status")} {status.text}</p>
          </div>
          {subscription.expiresAt && subscription.plan !== "free" && (
            <p className="text-sm text-neutral-500 dark:text-[#9AA39F]">
              {tPlansPage("validUntil")}{" "}
              <time className="font-medium text-neutral-800 dark:text-[#ECEAE4]">
                {new Intl.DateTimeFormat(dateLocale, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }).format(new Date(subscription.expiresAt))}
              </time>
            </p>
          )}
        </div>

        <ul className="mt-6 flex flex-col gap-2 text-sm text-neutral-700 dark:text-[#ECEAE4]">
          {plan.features.map((f) => (
            <li key={f} className="flex gap-2">
              <span className="font-bold text-[#065F46] dark:text-[#34D399]">✓</span>
              {f}
            </li>
          ))}
        </ul>
      </section>

      <section id="whatsapp" className="rounded-2xl border border-[#25D366]/25 bg-[#ECFDF5]/40 p-6 dark:border-[#34D399]/25 dark:bg-[#10B981]/10">
        <h2 className="text-sm font-semibold text-[#065F46] dark:text-[#34D399]">{tDashboard("whatsappSection")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#1C1B1A]/70 dark:text-[#9AA39F]">{tDashboard("whatsappDescription")}</p>
        {plan.whatsappReminders ? (
          <div className="mt-4">
            <UserWhatsAppSettingsForm currentPhone={userWhatsAppPhone} />
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-[#065F46]/15 bg-white/70 p-4 text-sm text-[#1C1B1A]/70 dark:border-[#26302C] dark:bg-[#161E1B] dark:text-[#9AA39F]">
            {tDashboard("featureGate.whatsapp")}{" "}
            <Link href="/pricing" className="font-medium text-[#065F46] hover:underline dark:text-[#34D399]">
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
        <section className="rounded-2xl border border-[#065F46]/15 bg-[#ECFDF5]/50 p-6 dark:border-[#34D399]/25 dark:bg-[#10B981]/10">
          <h2 className="font-semibold text-[#065F46] dark:text-[#34D399]">{tDashboard("upgradeSection")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#1C1B1A]/70 dark:text-[#9AA39F]">
            {tDashboard("upgradeDescription", { proPrice: proPricePhrase(locale === "en" ? "en" : "ar") })}
          </p>
          <p className="mt-2 text-sm text-[#1C1B1A]/60 dark:text-[#9AA39F]">{tDashboard("upgradePaymentNote")}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/pricing"
              className="rounded-lg bg-[#065F46] px-4 py-2 text-sm font-medium text-white hover:bg-[#054d3a] dark:bg-[#10B981] dark:text-[#04231A] dark:hover:bg-[#34D399]"
            >
              {tDashboard("viewPricing")}
            </Link>
            <a
              href={support.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-[#065F46]/30 px-4 py-2 text-sm font-medium text-[#065F46] hover:bg-[#ECFDF5] dark:border-[#34D399]/30 dark:text-[#34D399] dark:hover:bg-[#1E2824]"
            >
              {tDashboard("whatsappUpgrade")}
            </a>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6 dark:border-[#26302C] dark:bg-[#161E1B]">
        <h2 className="text-sm font-semibold text-neutral-800 dark:text-[#ECEAE4]">{tPlansPage("comparePlans")}</h2>

        {/* Mobile-Friendly Comparison Cards */}
        <div className="mt-4 flex flex-col gap-3 sm:hidden">
          {DISPLAY_PLANS.map((id: PlanId) => (
            <div
              key={id}
              className={`rounded-2xl border p-4 transition ${
                displayPlanId === id
                  ? "border-emerald-300 bg-[#ECFDF5]/40 shadow-xs dark:border-[#34D399]/40 dark:bg-[#10B981]/10"
                  : "border-neutral-200 bg-white dark:border-[#26302C] dark:bg-[#1E2824]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-[#ECEAE4]">{localizedPlanLabelById[id]}</h3>
                  <p className="mt-0.5 text-sm font-bold text-emerald-800 dark:text-[#34D399]">
                    {localizedPlanById[id].priceYearly === 0
                      ? tPlans("free")
                      : `${localizedPlanById[id].priceDisplay} ${localizedPlanById[id].periodDisplay}`}
                  </p>
                </div>
                {displayPlanId === id && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:border-[#34D399]/30 dark:bg-[#10B981]/20 dark:text-[#34D399]">
                    {tPlansPage("youAreHere")}
                  </span>
                )}
              </div>

              <ul className="mt-3 flex flex-col gap-1.5 border-t border-neutral-100 pt-3 text-xs text-neutral-600 dark:border-[#26302C] dark:text-[#9AA39F]">
                {localizedPlanById[id].features.slice(0, 5).map((f) => (
                  <li key={f} className="flex items-center gap-1.5">
                    <span className="font-bold text-emerald-700 dark:text-[#34D399]">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Desktop Comparison Table */}
        <div className="mt-4 hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[500px] text-right text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-xs text-neutral-500 dark:border-[#26302C] dark:text-[#9AA39F]">
                <th className="py-2.5 font-medium">{tPlansPage("planColumn")}</th>
                <th className="py-2.5 font-medium">{tPlansPage("priceColumn")}</th>
                <th className="py-2.5 font-medium">{tPlansPage("featuresColumn")}</th>
                <th className="py-2.5 text-center font-medium">{tPlansPage("youAreHere")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-[#26302C]">
              {DISPLAY_PLANS.map((id: PlanId) => (
                <tr
                  key={id}
                  className={`transition ${displayPlanId === id ? "bg-[#ECFDF5]/50 font-medium dark:bg-[#10B981]/10" : ""}`}
                >
                  <td className="py-3.5 font-bold text-neutral-900 dark:text-[#ECEAE4]">{localizedPlanLabelById[id]}</td>
                  <td className="py-3.5 font-semibold text-emerald-800 dark:text-[#34D399]">
                    {localizedPlanById[id].priceYearly === 0
                      ? tPlans("free")
                      : `${localizedPlanById[id].priceDisplay} ${localizedPlanById[id].periodDisplay}`}
                  </td>
                  <td className="py-3.5">
                    <ul className="flex flex-col gap-1 text-xs text-neutral-600 dark:text-[#9AA39F]">
                      {localizedPlanById[id].features.slice(0, 4).map((f) => (
                        <li key={f} className="flex items-center gap-1.5">
                          <span className="font-bold text-emerald-700 dark:text-[#34D399]">✓</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="py-3.5 text-center">
                    {displayPlanId === id ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:border-[#34D399]/30 dark:bg-[#10B981]/20 dark:text-[#34D399]">
                        {tPlansPage("youAreHere")}
                      </span>
                    ) : (
                      <span className="text-neutral-300 dark:text-[#66706B]">—</span>
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
