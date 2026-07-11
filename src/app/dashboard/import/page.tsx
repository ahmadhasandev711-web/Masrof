import Link from "next/link";
import { requireSession } from "@/features/auth/session";
import { getActiveWorkspaceForPage } from "@/features/workspaces/page-gate";
import { listAccountsForWorkspace } from "@/features/accounts/data";
import { listCategoriesForWorkspace } from "@/features/categories/data";
import { getWorkspacePlanContext } from "@/features/subscriptions/data";
import { BankImportForm } from "@/features/import/components/bank-import-form";
import { getTranslations } from "next-intl/server";

export default async function BankImportPage() {
  const session = await requireSession();
  const t = await getTranslations("pages.import");
  const tDashboard = await getTranslations("dashboard");
  const tPlan = await getTranslations("dashboard.plan");
  const { activeWorkspace, redirect } = await getActiveWorkspaceForPage(session.user.id);
  if (redirect) return redirect;
  const workspaceId = activeWorkspace._id.toString();
  const { plan } = await getWorkspacePlanContext(session.user.id, workspaceId);

  const [accounts, categories] = await Promise.all([
    listAccountsForWorkspace(workspaceId),
    listCategoriesForWorkspace(workspaceId, "expense"),
  ]);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">{t("title")}</h1>
        <p className="text-sm text-neutral-500">{activeWorkspace.name}</p>
      </div>

      {plan.bankImport ? (
        <BankImportForm
          workspaceId={workspaceId}
          accounts={accounts.map((a) => ({ id: a._id.toString(), name: a.name }))}
          expenseCategories={categories.map((c) => ({
            id: c._id.toString(),
            name: c.name,
          }))}
        />
      ) : (
        <div className="rounded-xl border border-[#065F46]/15 bg-[#ECFDF5]/50 p-4 text-sm text-[#1C1B1A]/70">
          {tDashboard("featureGate.bankImport")}{" "}
          <Link href="/pricing" className="font-medium text-[#065F46] hover:underline">
            {tPlan("viewPricing")}
          </Link>
          .
        </div>
      )}
    </div>
  );
}
