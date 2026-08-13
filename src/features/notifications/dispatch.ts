import "server-only";

import { connectToDatabase } from "@/lib/db/mongoose";
import { sendEmail, isEmailConfigured } from "@/lib/email/send";
import { formatMoney } from "@/lib/money";
import { UserSubscriptionModel } from "@/models/user-subscription";
import { getLocalizedPlanFromConfig } from "@/features/subscriptions/plan-config-data";
import type { PlanId } from "@/features/subscriptions/plans";
import { assertPlanFeature } from "@/features/subscriptions/data";
import { sendPushToUser } from "@/lib/push";
import type { AppLocale } from "@/i18n/config";
import { DEFAULT_LOCALE } from "@/i18n/config";
import type { RecurringExpenseListItem } from "@/features/recurring-expenses/data";
import {
  budgetWarningEmail,
  newsletterWelcomeEmail,
  recurringDueEmail,
  subscriptionExpiringEmail,
  welcomeEmail,
  getBudgetPushStrings,
  getRecurringPushStrings,
} from "@/features/notifications/templates";
import {
  dailyDedupeKey,
  releaseNotificationClaim,
  tryClaimNotificationSend,
} from "@/features/notifications/data";
import type { BudgetWarning } from "@/features/dashboard/alerts";

function fmt(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

async function sendOnce(
  dedupeKey: string,
  userId: string | null,
  type: string,
  payload: { to: string; subject: string; text: string; html: string },
) {
  const claimed = await tryClaimNotificationSend(dedupeKey, userId, type);
  if (!claimed) {
    return;
  }

  try {
    await sendEmail(payload);
  } catch (error) {
    await releaseNotificationClaim(dedupeKey);
    throw error;
  }
}

export async function sendWelcomeNotification(input: {
  userId: string;
  email: string;
  name: string;
  locale?: AppLocale;
}) {
  if (!isEmailConfigured()) return;

  const dedupeKey = `user:${input.userId}:welcome`;
  const template = await welcomeEmail(input.name, input.locale ?? DEFAULT_LOCALE);

  try {
    await sendOnce(dedupeKey, input.userId, "welcome", {
      to: input.email,
      ...template,
    });
  } catch (error) {
    console.error("[notifications] welcome email failed:", error);
  }
}

export async function sendNewsletterWelcomeNotification(email: string) {
  if (!isEmailConfigured()) return;

  const dedupeKey = `newsletter:${email.toLowerCase()}:welcome`;
  const template = await newsletterWelcomeEmail();

  try {
    await sendOnce(dedupeKey, null, "newsletter_welcome", {
      to: email,
      ...template,
    });
  } catch (error) {
    console.error("[notifications] newsletter welcome failed:", error);
  }
}

function formatArDate(isoDate: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(isoDate));
}

export async function dispatchDashboardEmailNotifications(input: {
  userId: string;
  userEmail: string;
  workspaceId: string;
  workspaceName: string;
  currency: string;
  budgetWarnings: BudgetWarning[];
  dueRecurring: RecurringExpenseListItem[];
  locale?: AppLocale;
}) {
  if (!isEmailConfigured() || !input.userEmail) return;
  const locale = input.locale ?? DEFAULT_LOCALE;

  for (const budget of input.budgetWarnings) {
    const dedupeKey = dailyDedupeKey([
      input.userId,
      "budget_warning",
      input.workspaceId,
      budget.id,
    ]);
    const spentLabel = formatMoney(budget.spent, { currency: input.currency });
    const limitLabel = formatMoney(budget.amount, { currency: input.currency });
    const template = await budgetWarningEmail(
      {
        workspaceName: input.workspaceName,
        budgetName: budget.name,
        percentage: budget.percentage,
        spentLabel,
        limitLabel,
        exceeded: budget.status === "exceeded",
      },
      locale,
    );

    try {
      await sendOnce(dedupeKey, input.userId, "budget_warning", {
        to: input.userEmail,
        ...template,
      });
    } catch (error) {
      console.error("[notifications] budget warning failed:", error);
    }
  }

  for (const item of input.dueRecurring) {
    const dedupeKey = dailyDedupeKey([
      input.userId,
      "recurring_due",
      input.workspaceId,
      item.id,
    ]);
    const template = await recurringDueEmail(
      {
        workspaceName: input.workspaceName,
        description: item.description || item.categoryName,
        amountLabel: formatMoney(item.amount, { currency: input.currency }),
        dueDateLabel: formatArDate(item.nextDueDate),
      },
      locale,
    );

    try {
      await sendOnce(dedupeKey, input.userId, "recurring_due", {
        to: input.userEmail,
        ...template,
      });
    } catch (error) {
      console.error("[notifications] recurring due failed:", error);
    }
  }

  await dispatchSubscriptionExpiryNotification(input.userId, input.userEmail, locale);
}

export async function dispatchDashboardPushNotifications(input: {
  userId: string;
  workspaceId: string;
  workspaceName: string;
  currency: string;
  budgetWarnings: BudgetWarning[];
  dueRecurring: RecurringExpenseListItem[];
  locale?: AppLocale;
}) {
  const featureError = await assertPlanFeature(input.userId, "pushNotifications");
  if (featureError) return;
  const locale = input.locale ?? DEFAULT_LOCALE;

  const [tBudget, tRecurring] = await Promise.all([
    getBudgetPushStrings(locale),
    getRecurringPushStrings(locale),
  ]);

  for (const budget of input.budgetWarnings) {
    const dedupeKey = dailyDedupeKey([
      input.userId,
      "push_budget_warning",
      input.workspaceId,
      budget.id,
    ]);

    const claimed = await tryClaimNotificationSend(
      dedupeKey,
      input.userId,
      "push_budget_warning",
    );
    if (!claimed) continue;

    const result = await sendPushToUser(input.userId, {
      title:
        budget.status === "exceeded" ? tBudget.exceededPushTitle : tBudget.warningPushTitle,
      body: fmt(tBudget.pushBody, {
        name: budget.name,
        spent: formatMoney(budget.spent, { currency: input.currency }),
        limit: formatMoney(budget.amount, { currency: input.currency }),
      }),
      url: "/dashboard/budgets",
    });

    if (result.sent === 0) {
      await releaseNotificationClaim(dedupeKey);
    }
  }

  for (const item of input.dueRecurring) {
    const dedupeKey = dailyDedupeKey([
      input.userId,
      "push_recurring_due",
      input.workspaceId,
      item.id,
    ]);

    const claimed = await tryClaimNotificationSend(
      dedupeKey,
      input.userId,
      "push_recurring_due",
    );
    if (!claimed) continue;

    const result = await sendPushToUser(input.userId, {
      title: tRecurring.pushTitle,
      body: `${item.description || item.categoryName}: ${formatMoney(item.amount, {
        currency: input.currency,
      })}`,
      url: "/dashboard/budgets#recurring",
    });

    if (result.sent === 0) {
      await releaseNotificationClaim(dedupeKey);
    }
  }
}

async function dispatchSubscriptionExpiryNotification(
  userId: string,
  userEmail: string,
  locale: AppLocale = DEFAULT_LOCALE,
) {
  await connectToDatabase();
  const record = await UserSubscriptionModel.findOne({
    userId,
    status: "active",
    expiresAt: { $ne: null },
  }).lean();

  if (!record?.expiresAt) return;

  const planId = record.plan as PlanId;
  if (planId === "free") return;

  const expiresAt = new Date(record.expiresAt);
  const msLeft = expiresAt.getTime() - Date.now();
  const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

  if (daysLeft < 1 || daysLeft > 7) return;

  const dedupeKey = dailyDedupeKey([userId, "subscription_expiring", planId]);
  const localizedPlan = await getLocalizedPlanFromConfig(
    planId,
    locale === "en" ? "en" : "ar",
  );
  const template = await subscriptionExpiringEmail(
    {
      planName: localizedPlan.name,
      expiresAtLabel: formatArDate(expiresAt.toISOString()),
      daysLeft,
    },
    locale,
  );

  try {
    await sendOnce(dedupeKey, userId, "subscription_expiring", {
      to: userEmail,
      ...template,
    });
  } catch (error) {
    console.error("[notifications] subscription expiry failed:", error);
  }
}
