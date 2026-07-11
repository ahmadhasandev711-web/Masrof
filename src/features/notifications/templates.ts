import type { AppLocale } from "@/i18n/config";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { loadMessages } from "@/i18n/messages/loader";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

type NotificationMessages = {
  footer: string;
  welcome: {
    greeting: string;
    greetingDefault: string;
    subject: string;
    body: string;
    dashboardLink: string;
  };
  newsletter: {
    subject: string;
    thanks: string;
    promise: string;
  };
  budget: {
    exceededTitle: string;
    warningTitle: string;
    inWorkspace: string;
    spending: string;
    reviewLink: string;
    exceededPushTitle: string;
    warningPushTitle: string;
    pushBody: string;
  };
  recurring: {
    subject: string;
    dueInWorkspace: string;
    dueDate: string;
    recordLink: string;
    defaultDescription: string;
    pushTitle: string;
  };
  subscription: {
    subject: string;
    body: string;
    daysLeft: string;
    renewLink: string;
    myPlanLink: string;
  };
};

function fmt(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

function emailFooter(locale: AppLocale) {
  const label = locale === "en" ? "Masrofaty" : "مصروفاتي";
  return `${label} — <a href="${appUrl}">${appUrl}</a>`;
}

function layout(body: string, footer: string) {
  return `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.6;color:#1C1B1A">
${body}
<p style="margin-top:24px;font-size:12px;color:#888">${footer}</p>
</div>`;
}

async function notificationsFor(locale: AppLocale): Promise<NotificationMessages> {
  const messages = await loadMessages(locale);
  return messages.notifications as NotificationMessages;
}

export async function welcomeEmail(name: string, locale: AppLocale = DEFAULT_LOCALE) {
  const n = await notificationsFor(locale);
  const greeting = name ? fmt(n.welcome.greeting, { name }) : n.welcome.greetingDefault;
  const footer = emailFooter(locale);

  return {
    subject: n.welcome.subject,
    text: `${greeting},\n\n${n.welcome.body}\n${appUrl}/dashboard`,
    html: layout(
      `<p>${greeting},</p><p>${n.welcome.body} <a href="${appUrl}/dashboard">${n.welcome.dashboardLink}</a>.</p>`,
      footer,
    ),
  };
}

export async function newsletterWelcomeEmail(locale: AppLocale = DEFAULT_LOCALE) {
  const n = await notificationsFor(locale);
  const footer = emailFooter(locale);

  return {
    subject: n.newsletter.subject,
    text: `${n.newsletter.thanks}\n\n${n.newsletter.promise}`,
    html: layout(`<p>${n.newsletter.thanks}</p><p>${n.newsletter.promise}</p>`, footer),
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
  const n = await notificationsFor(locale);
  const footer = emailFooter(locale);
  const title = input.exceeded ? n.budget.exceededTitle : n.budget.warningTitle;
  const inWorkspace = fmt(n.budget.inWorkspace, { workspace: input.workspaceName });
  const spending = fmt(n.budget.spending, {
    spent: input.spentLabel,
    limit: input.limitLabel,
    percentage: String(input.percentage),
  });

  return {
    subject: `${title}: ${input.budgetName}`,
    text: `${title} «${input.budgetName}» ${inWorkspace}\n\n${spending}\n\n${appUrl}/dashboard/budgets`,
    html: layout(
      `<p><strong>${title}</strong> «${input.budgetName}» ${inWorkspace}</p>
<p>${spending}</p>
<p><a href="${appUrl}/dashboard/budgets">${n.budget.reviewLink}</a></p>`,
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
  const n = await notificationsFor(locale);
  const footer = emailFooter(locale);
  const description = input.description || n.recurring.defaultDescription;
  const dueInWorkspace = fmt(n.recurring.dueInWorkspace, { workspace: input.workspaceName });
  const dueDate = fmt(n.recurring.dueDate, { date: input.dueDateLabel });

  return {
    subject: fmt(n.recurring.subject, { description }),
    text: `${dueInWorkspace}\n\n${description} — ${input.amountLabel}\n${dueDate}\n\n${appUrl}/dashboard/budgets#recurring`,
    html: layout(
      `<p>${dueInWorkspace}</p>
<p><strong>${description}</strong> — ${input.amountLabel}<br/>${dueDate}</p>
<p><a href="${appUrl}/dashboard/budgets#recurring">${n.recurring.recordLink}</a></p>`,
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
  const n = await notificationsFor(locale);
  const footer = emailFooter(locale);
  const days = String(input.daysLeft);

  return {
    subject: fmt(n.subscription.subject, { plan: input.planName, days }),
    text: `${fmt(n.subscription.body, { plan: input.planName, expiresAt: input.expiresAtLabel })}\n\n${appUrl}/support`,
    html: layout(
      `<p>${fmt(n.subscription.body, { plan: input.planName, expiresAt: input.expiresAtLabel })} ${fmt(n.subscription.daysLeft, { days })}</p>
<p><a href="${appUrl}/support">${n.subscription.renewLink}</a> · <a href="${appUrl}/dashboard/plan">${n.subscription.myPlanLink}</a></p>`,
      footer,
    ),
  };
}

export async function getBudgetPushStrings(locale: AppLocale = DEFAULT_LOCALE) {
  const n = await notificationsFor(locale);
  return n.budget;
}

export async function getRecurringPushStrings(locale: AppLocale = DEFAULT_LOCALE) {
  const n = await notificationsFor(locale);
  return n.recurring;
}
