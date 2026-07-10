import { requireSession } from "@/features/auth/session";
import { getCurrentWorkspaceContext } from "@/features/workspaces/current";
import { listCategoriesForWorkspace } from "@/features/categories/data";
import { listAccountsForWorkspace } from "@/features/accounts/data";
import { listBudgetsWithProgress } from "@/features/budgets/data";
import { listRecurringExpenses } from "@/features/recurring-expenses/data";
import { CreateBudgetForm } from "@/features/budgets/components/create-budget-form";
import { BudgetList } from "@/features/budgets/components/budget-list";
import { CreateRecurringExpenseForm } from "@/features/recurring-expenses/components/create-recurring-form";
import { RecurringExpenseList } from "@/features/recurring-expenses/components/recurring-expense-list";
import { getWorkspacePlanContext } from "@/features/subscriptions/data";
import { getUserWhatsAppPhone } from "@/features/whatsapp/data";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function BudgetsPage() {
  const session = await requireSession();
  const t = await getTranslations("pages.budgets");
  const tDashboard = await getTranslations("dashboard");
  const tPlan = await getTranslations("dashboard.plan");
  const { activeWorkspace } = await getCurrentWorkspaceContext(session.user.id);
  const workspaceId = activeWorkspace._id.toString();
  const { plan } = await getWorkspacePlanContext(session.user.id, workspaceId);

  const [expenseCategories, budgets, accounts, recurringExpenses, userWhatsAppPhone] = await Promise.all([
    listCategoriesForWorkspace(workspaceId, "expense"),
    listBudgetsWithProgress(workspaceId),
    listAccountsForWorkspace(workspaceId),
    listRecurringExpenses(workspaceId),
    getUserWhatsAppPhone(session.user.id),
  ]);

  const accountOptions = accounts.map((a) => ({ id: a._id.toString(), name: a.name }));
  const categoryOptions = expenseCategories.map((c) => ({
    id: c._id.toString(),
    name: c.name,
    icon: c.icon,
  }));

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">{t("title")}</h1>
        <p className="text-sm text-neutral-500">{activeWorkspace.name}</p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-neutral-700">{tDashboard("budgets.monthlySection")}</h2>
        <CreateBudgetForm
          workspaceId={workspaceId}
          expenseCategories={categoryOptions}
        />
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
                    icon?: string | null;
                  };
                  return {
                    _id: String(cat._id),
                    name: cat.name,
                    icon: cat.icon ?? null,
                  };
                })()
              : null,
          }))}
          workspaceId={workspaceId}
          currency={activeWorkspace.currency}
        />
      </section>

      <section id="recurring" className="flex flex-col gap-4 border-t border-neutral-200 pt-8">
        <div>
          <h2 className="text-sm font-semibold text-neutral-700">{tDashboard("budgets.recurringSection")}</h2>
          <p className="mt-1 text-xs leading-relaxed text-neutral-500">
            {tDashboard("budgets.recurringHint")}
          </p>
        </div>
        {plan.recurringExpenses ? (
          <>
            <CreateRecurringExpenseForm
              workspaceId={workspaceId}
              accounts={accountOptions}
              expenseCategories={categoryOptions}
            />
            <RecurringExpenseList
              items={recurringExpenses}
              workspaceId={workspaceId}
              currency={activeWorkspace.currency}
              workspaceName={activeWorkspace.name}
              userWhatsAppPhone={userWhatsAppPhone}
              canUseWhatsApp={plan.whatsappReminders}
            />
          </>
        ) : (
          <div className="rounded-xl border border-[#065F46]/15 bg-[#ECFDF5]/50 p-4 text-sm text-[#1C1B1A]/70">
            {tDashboard("featureGate.recurring")}{" "}
            <Link href="/pricing" className="font-medium text-[#065F46] hover:underline">
              {tPlan("viewPricing")}
            </Link>
            .
          </div>
        )}
      </section>
    </div>
  );
}
