import { getTranslations } from "next-intl/server";
import { requireSession } from "@/features/auth/session";
import { getActiveWorkspaceForPage } from "@/features/workspaces/page-gate";
import { getWorkspacePlanContext } from "@/features/subscriptions/data";
import { getWorkspaceAccess } from "@/features/workspaces/access";
import { listAccountsForWorkspace } from "@/features/accounts/data";
import { getDebtsForWorkspace, calculateDebtSummaryFromDebts } from "@/features/debts/data";
import { DebtsGate } from "@/features/debts/components/debts-gate";
import { DebtsSummaryCards } from "@/features/debts/components/debts-summary";
import { CreateDebtDialog } from "@/features/debts/components/create-debt-dialog";
import { DebtsList } from "@/features/debts/components/debts-list";

export default async function DebtsPage() {
  const session = await requireSession();
  const t = await getTranslations("forms.debts");
  const { activeWorkspace, redirect } = await getActiveWorkspaceForPage(session.user.id);
  if (redirect) return redirect;

  const workspaceId = activeWorkspace._id.toString();
  const currency = activeWorkspace.currency;

  const { plan } = await getWorkspacePlanContext(session.user.id, workspaceId);

  // Feature gate check: Debts is exclusive to Pro plan
  if (!plan.debts) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            {t("gateTitle")}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {t("gateDescription")}
          </p>
        </div>
        <DebtsGate />
      </div>
    );
  }

  // Load debts, accounts, and access in parallel; compute summary in-memory with 0 redundant DB queries
  const [debts, accounts, access] = await Promise.all([
    getDebtsForWorkspace(workspaceId),
    listAccountsForWorkspace(workspaceId),
    getWorkspaceAccess(session.user.id, workspaceId),
  ]);

  const canWrite = access.membership.role !== "viewer";
  const summary = calculateDebtSummaryFromDebts(debts, currency);

  const accountOptions = accounts.map((acc) => ({
    _id: String(acc._id),
    name: acc.name,
    currency: acc.currency,
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              {t("title")}
            </h1>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              PRO
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            {t("subtitle")}
          </p>
        </div>

        {canWrite && <CreateDebtDialog workspaceId={workspaceId} currency={currency} />}
      </div>

      {/* Financial Summary */}
      <DebtsSummaryCards summary={summary} />

      {/* Debts List */}
      <DebtsList
        debts={debts}
        accounts={accountOptions}
        workspaceId={workspaceId}
        currency={currency}
        canWrite={canWrite}
      />
    </div>
  );
}
