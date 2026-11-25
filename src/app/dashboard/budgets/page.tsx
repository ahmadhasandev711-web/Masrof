import { requireSession } from "@/features/auth/session";
import { getActiveWorkspaceForPage } from "@/features/workspaces/page-gate";
import { categoriesService } from "@/features/categories/categories.service";
import { accountsService } from "@/features/accounts/accounts.service";
import { budgetsService } from "@/features/budgets/budgets.service";
import { recurringExpensesService } from "@/features/recurring-expenses/recurring-expenses.service";
import { BudgetCreationManager } from "@/features/budgets/components/budget-creation-manager";
import { BudgetList } from "@/features/budgets/components/budget-list";
import { RecurringExpenseCreationManager } from "@/features/recurring-expenses/components/recurring-expense-creation-manager";
import { RecurringExpenseList } from "@/features/recurring-expenses/components/recurring-expense-list";
import { getWorkspacePlanContext } from "@/features/subscriptions/data";
import { getWorkspaceAccess } from "@/features/workspaces/access";
import { getPlanQuantityLimit } from "@/features/subscriptions/plan-config-data";
import {
  countRecurringExpensesForWorkspace,
  toQuantityUsage,
} from "@/features/subscriptions/plan-usage";
import { PlanUsageMeter } from "@/features/subscriptions/components/plan-usage-meter";
import { getUserWhatsAppPhone } from "@/features/whatsapp/data";
import { formatMoney } from "@/lib/money";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { mapPlainCategoryToOption } from "@/features/categories/map-options";
import type { AppLocale } from "@/i18n/config";

export default async function BudgetsPage() {
  const session = await requireSession();
  const t = await getTranslations("pages.budgets");
  const tDashboard = await getTranslations("dashboard");
  const tPlan = await getTranslations("dashboard.plan");
  const tUsage = await getTranslations("dashboard.usage");
  const { activeWorkspace, redirect } = await getActiveWorkspaceForPage(session.user.id);
  if (redirect) return redirect;
  const workspaceId = activeWorkspace._id.toString();
  const { plan, subscription } = await getWorkspacePlanContext(session.user.id, workspaceId);

  const [
    expenseCategories,
    budgets,
    accounts,
    recurringExpenses,
    userWhatsAppPhone,
    recurringCount,
    recurringLimit,
    locale,
    access,
  ] = await Promise.all([
    categoriesService.listForWorkspace(workspaceId, "expense"),
    budgetsService.listWithProgress(workspaceId),
    accountsService.listForWorkspace(workspaceId),
    recurringExpensesService.listForWorkspace(workspaceId),
    getUserWhatsAppPhone(session.user.id),
    countRecurringExpensesForWorkspace(workspaceId),
    getPlanQuantityLimit(subscription.plan, "maxRecurringExpenses"),
    getLocale(),
    getWorkspaceAccess(session.user.id, workspaceId),
  ]);

  const canWrite = access.membership.role !== "viewer";
  const recurringUsage = toQuantityUsage(recurringCount, recurringLimit);

  const tConversion = await getTranslations("reports.conversion");
  const conversionIncomplete = budgets.some((b) => b.conversionIncomplete);
  const totalBudgeted = budgets.reduce((sum, b) => sum + (b.amount || 0), 0);
  const totalSpent = conversionIncomplete
    ? null
    : budgets.reduce((sum, b) => sum + (b.spent ?? 0), 0);
  const totalRemaining = totalSpent == null ? null : Math.max(0, totalBudgeted - totalSpent);
  const overallPercentage =
    totalSpent == null || totalBudgeted <= 0 ? null : Math.round((totalSpent / totalBudgeted) * 100);

  const formatOptions = {
    currency: activeWorkspace.currency,
    locale: locale === "ar" ? "ar-EG" : "en-US",
  };

  const accountOptions = accounts.map((a) => ({ id: a._id.toString(), name: a.name }));
  const categoryOptions = expenseCategories.map((c) =>
    mapPlainCategoryToOption(c, locale as AppLocale),
  );

  return (
    <div className="flex max-w-5xl flex-col gap-8">
      <div>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-[#ECEAE4] sm:text-2xl">{t("title")}</h1>
        <p className="text-sm text-neutral-500 dark:text-[#9AA39F]">{t("subtitle")}</p>
      </div>

      <section className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-[#ECEAE4] sm:text-lg">
              {tDashboard("budgets.monthlySection")}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-[#9AA39F]">{activeWorkspace.name}</p>
          </div>
          {plan.budgets && canWrite && (
            <BudgetCreationManager
              workspaceId={workspaceId}
              expenseCategories={categoryOptions}
            />
          )}
        </div>

        {plan.budgets && budgets.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <div className="rounded-2xl border border-neutral-200/80 dark:border-[#26302C] bg-white dark:bg-[#161E1B] p-4 shadow-xs">
              <p className="text-xs font-medium text-neutral-500 dark:text-[#9AA39F]">{t("totalBudgeted")}</p>
              <p className="mt-1 font-mono text-base font-bold tabular-nums text-neutral-900 dark:text-[#ECEAE4] sm:text-lg">
                {formatMoney(totalBudgeted, formatOptions)}
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-200/80 dark:border-[#26302C] bg-white dark:bg-[#161E1B] p-4 shadow-xs">
              <p className="text-xs font-medium text-neutral-500 dark:text-[#9AA39F]">{t("totalSpent")}</p>
              <p className="mt-1 font-mono text-base font-bold tabular-nums text-neutral-900 dark:text-[#ECEAE4] sm:text-lg">
                {totalSpent == null ? tConversion("unavailable") : formatMoney(totalSpent, formatOptions)}
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-200/80 dark:border-[#26302C] bg-white dark:bg-[#161E1B] p-4 shadow-xs">
              <p className="text-xs font-medium text-neutral-500 dark:text-[#9AA39F]">{t("totalRemaining")}</p>
              <p className="mt-1 font-mono text-base font-bold tabular-nums text-neutral-900 dark:text-[#ECEAE4] sm:text-lg">
                {totalRemaining == null ? tConversion("unavailable") : formatMoney(totalRemaining, formatOptions)}
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-200/80 dark:border-[#26302C] bg-white dark:bg-[#161E1B] p-4 shadow-xs">
              <p className="text-xs font-medium text-neutral-500 dark:text-[#9AA39F]">{t("consumptionRate")}</p>
              <p
                className={`mt-1 font-mono text-base font-bold tabular-nums sm:text-lg ${
                  overallPercentage == null
                    ? "text-neutral-500 dark:text-[#9AA39F]"
                    : overallPercentage >= 100
                      ? "text-red-600 dark:text-rose-400"
                      : overallPercentage >= 80
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-emerald-700 dark:text-[#34D399]"
                }`}
              >
                {overallPercentage == null ? tConversion("unavailable") : `${overallPercentage}%`}
              </p>
            </div>
          </div>
        )}

        {plan.budgets ? (
          <BudgetList
            budgets={budgets.map((b) => ({
              _id: String(b._id),
              name: b.name,
              amount: b.amount,
              spent: b.spent,
              remaining: b.remaining,
              percentage: b.percentage,
              categoryId: b.categoryId
                ? (() => {
                    const cat = b.categoryId as unknown as {
                      _id: unknown;
                      name: string;
                      nameEn?: string | null;
                      icon?: string | null;
                    };
                    return {
                      _id: String(cat._id),
                      name: cat.name,
                      nameEn: cat.nameEn ?? null,
                      icon: cat.icon ?? null,
                    };
                  })()
                : null,
            }))}
            workspaceId={workspaceId}
            currency={activeWorkspace.currency}
            canWrite={canWrite}
          />
        ) : (
          <div className="rounded-xl border border-[#065F46]/15 dark:border-[#34D399]/25 bg-[#ECFDF5]/50 dark:bg-[#0F2E24] p-4 text-sm text-[#1C1B1A]/70 dark:text-[#ECEAE4]">
            {tDashboard("plan.featureGate.budgets")}{" "}
            <Link href="/pricing" className="font-medium text-[#065F46] dark:text-[#34D399] hover:underline">
              {tPlan("viewPricing")}
            </Link>
            .
          </div>
        )}
      </section>

      <section id="recurring" className="flex flex-col gap-4 border-t border-neutral-200 dark:border-[#26302C] pt-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-[#ECEAE4] sm:text-lg">
              {tDashboard("budgets.recurringSection")}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500 dark:text-[#9AA39F]">
              {tDashboard("budgets.recurringHint")}
            </p>
          </div>
          {plan.recurringExpenses && !recurringUsage.atLimit && canWrite && (
            <RecurringExpenseCreationManager
              workspaceId={workspaceId}
              accounts={accountOptions}
              expenseCategories={categoryOptions}
            />
          )}
        </div>
        {plan.recurringExpenses ? (
          <>
            <PlanUsageMeter usage={recurringUsage} label={tUsage("recurringExpenses")} />
            <RecurringExpenseList
              items={recurringExpenses}
              workspaceId={workspaceId}
              currency={activeWorkspace.currency}
              workspaceName={activeWorkspace.name}
              userWhatsAppPhone={userWhatsAppPhone}
              canUseWhatsApp={plan.whatsappReminders}
              canWrite={canWrite}
            />
          </>
        ) : (
          <div className="rounded-xl border border-[#065F46]/15 dark:border-[#34D399]/25 bg-[#ECFDF5]/50 dark:bg-[#0F2E24] p-4 text-sm text-[#1C1B1A]/70 dark:text-[#ECEAE4]">
            {tDashboard("featureGate.recurring")}{" "}
            <Link href="/pricing" className="font-medium text-[#065F46] dark:text-[#34D399] hover:underline">
              {tPlan("viewPricing")}
            </Link>
            .
          </div>
        )}
      </section>
    </div>
  );
}
