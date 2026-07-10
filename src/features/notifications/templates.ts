import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/config";
import { DEFAULT_LOCALE } from "@/i18n/config";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function layout(body: string, footer: string) {
  return `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.6;color:#1C1B1A">
${body}
<p style="margin-top:24px;font-size:12px;color:#888">${footer}</p>
</div>`;
}

export async function welcomeEmail(name: string, locale: AppLocale = DEFAULT_LOCALE) {
  const t = await getTranslations({ locale, namespace: "notifications.welcome" });
  const tFooter = await getTranslations({ locale, namespace: "notifications" });
  const greeting = name ? t("greeting", { name }) : t("greetingDefault");
  const footer = tFooter("footer", { appUrl });

  return {
    subject: t("subject"),
    text: `${greeting},\n\n${t("body")}\n${appUrl}/dashboard`,
    html: layout(
      `<p>${greeting},</p><p>${t("body")} <a href="${appUrl}/dashboard">${t("dashboardLink")}</a>.</p>`,
      footer,
    ),
  };
}

export async function newsletterWelcomeEmail(locale: AppLocale = DEFAULT_LOCALE) {
  const t = await getTranslations({ locale, namespace: "notifications.newsletter" });
  const tFooter = await getTranslations({ locale, namespace: "notifications" });
  const footer = tFooter("footer", { appUrl });

  return {
    subject: t("subject"),
    text: `${t("thanks")}\n\n${t("promise")}`,
    html: layout(`<p>${t("thanks")}</p><p>${t("promise")}</p>`, footer),
  };
}

export async function budgetWarningEmail(
  input: {
    workspaceName: string;
    budgetName: string;
    percentage: number;
    spentLabel: string;
    limitLabel: string;
    exceeded: boolean;
  },
  locale: AppLocale = DEFAULT_LOCALE,
) {
  const t = await getTranslations({ locale, namespace: "notifications.budget" });
  const tFooter = await getTranslations({ locale, namespace: "notifications" });
  const footer = tFooter("footer", { appUrl });
  const title = input.exceeded ? t("exceededTitle") : t("warningTitle");

  return {
    subject: `${title}: ${input.budgetName}`,
    text: `${title} «${input.budgetName}» ${t("inWorkspace", { workspace: input.workspaceName })}\n\n${t("spending", { spent: input.spentLabel, limit: input.limitLabel, percentage: String(input.percentage) })}\n\n${appUrl}/dashboard/budgets`,
    html: layout(
      `<p><strong>${title}</strong> «${input.budgetName}» ${t("inWorkspace", { workspace: input.workspaceName })}</p>
<p>${t("spending", { spent: input.spentLabel, limit: input.limitLabel, percentage: String(input.percentage) })}</p>
<p><a href="${appUrl}/dashboard/budgets">${t("reviewLink")}</a></p>`,
      footer,
    ),
  };
}

export async function recurringDueEmail(
  input: {
    workspaceName: string;
    description: string;
    amountLabel: string;
    dueDateLabel: string;
  },
  locale: AppLocale = DEFAULT_LOCALE,
) {
  const t = await getTranslations({ locale, namespace: "notifications.recurring" });
  const tFooter = await getTranslations({ locale, namespace: "notifications" });
  const footer = tFooter("footer", { appUrl });
  const description = input.description || t("defaultDescription");

  return {
    subject: t("subject", { description }),
    text: `${t("dueInWorkspace", { workspace: input.workspaceName })}\n\n${description} — ${input.amountLabel}\n${t("dueDate", { date: input.dueDateLabel })}\n\n${appUrl}/dashboard/budgets#recurring`,
    html: layout(
      `<p>${t("dueInWorkspace", { workspace: input.workspaceName })}</p>
<p><strong>${description}</strong> — ${input.amountLabel}<br/>${t("dueDate", { date: input.dueDateLabel })}</p>
<p><a href="${appUrl}/dashboard/budgets#recurring">${t("recordLink")}</a></p>`,
      footer,
    ),
  };
}

export async function subscriptionExpiringEmail(
  input: {
    planName: string;
    expiresAtLabel: string;
    daysLeft: number;
  },
  locale: AppLocale = DEFAULT_LOCALE,
) {
  const t = await getTranslations({ locale, namespace: "notifications.subscription" });
  const tFooter = await getTranslations({ locale, namespace: "notifications" });
  const footer = tFooter("footer", { appUrl });

  return {
    subject: t("subject", { plan: input.planName, days: String(input.daysLeft) }),
    text: `${t("body", { plan: input.planName, expiresAt: input.expiresAtLabel })}\n\n${appUrl}/support`,
    html: layout(
      `<p>${t("body", { plan: input.planName, expiresAt: input.expiresAtLabel })} ${t("daysLeft", { days: String(input.daysLeft) })}</p>
<p><a href="${appUrl}/support">${t("renewLink")}</a> · <a href="${appUrl}/dashboard/plan">${t("myPlanLink")}</a></p>`,
      footer,
    ),
  };
}
