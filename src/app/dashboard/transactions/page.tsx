import { requireSession } from "@/features/auth/session";
import { getActiveWorkspaceForPage } from "@/features/workspaces/page-gate";
import { canWorkspaceWrite, getWorkspaceAccess } from "@/features/workspaces/access";
import { listAccountsForWorkspace } from "@/features/accounts/data";
import { listCategoriesForWorkspace } from "@/features/categories/data";
import { listTransactions } from "@/features/transactions/data";
import { resolveAccountCurrency } from "@/lib/currency";
import type { SupportedCurrency } from "@/models/workspace";
import { listTransfersForWorkspace } from "@/features/transfers/data";
import { listClientsForWorkspace } from "@/features/clients/data";
import { listProjectsForWorkspace } from "@/features/projects/data";
import { transactionFiltersSchema } from "@/features/transactions/schemas";
import { CreateTransferForm } from "@/features/transfers/components/create-transfer-form";
import { CreateTransactionForm } from "@/features/transactions/components/create-transaction-form";
import { TransactionFiltersForm } from "@/features/transactions/components/transaction-filters";
import { TransactionList } from "@/features/transactions/components/transaction-list";
import { TransactionPagination } from "@/features/transactions/components/pagination";
import { ExportTransactionsExcelButton } from "@/features/transactions/components/export-excel-button";
import { TransferList } from "@/features/transfers/components/transfer-list";
import { getWorkspacePlanContext } from "@/features/subscriptions/data";
import { getTranslations } from "next-intl/server";

type SearchParams = Record<string, string | undefined>;

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireSession();
  const t = await getTranslations("pages.transactions");
  const { activeWorkspace, redirect } = await getActiveWorkspaceForPage(session.user.id);
  if (redirect) return redirect;
  const workspaceId = activeWorkspace._id.toString();
  const { plan } = await getWorkspacePlanContext(session.user.id, workspaceId);
  const access = await getWorkspaceAccess(session.user.id, workspaceId);
  const canWrite = canWorkspaceWrite(access.membership.role);

  const rawParams = await searchParams;

  const filters = transactionFiltersSchema.parse({
    workspaceId,
    type: rawParams.type || undefined,
    accountId: rawParams.accountId || undefined,
    categoryId: rawParams.categoryId || undefined,
    dateFrom: rawParams.dateFrom || undefined,
    dateTo: rawParams.dateTo || undefined,
    search: rawParams.search || undefined,
    page: rawParams.page || 1,
  });

  const [accounts, categories, transactionsResult, transfers, clients, projects] = await Promise.all([
    listAccountsForWorkspace(workspaceId),
    listCategoriesForWorkspace(workspaceId),
    listTransactions(filters),
    listTransfersForWorkspace(workspaceId),
    listClientsForWorkspace(workspaceId),
    listProjectsForWorkspace(workspaceId),
  ]);

  const accountOptions = accounts.map((a) => ({
    id: String(a._id),
    name: a.name,
    currency: resolveAccountCurrency(a.currency, activeWorkspace.currency as SupportedCurrency),
  }));
  const accountCurrencies = Object.fromEntries(accountOptions.map((a) => [a.id, a.currency]));
  const categoryOptions = categories.map((c) => ({
    id: String(c._id),
    name: c.name,
    kind: c.kind,
    icon: c.icon,
  }));

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">{t("title")}</h1>
          <p className="text-sm text-neutral-500">{activeWorkspace.name}</p>
        </div>
        {plan.csvExport ? (
          <ExportTransactionsExcelButton
            workspaceId={workspaceId}
            filters={{
              type: rawParams.type,
              accountId: rawParams.accountId,
              categoryId: rawParams.categoryId,
              dateFrom: rawParams.dateFrom,
              dateTo: rawParams.dateTo,
              search: rawParams.search,
            }}
          />
        ) : null}
      </div>

      {canWrite ? (
        <>
          <CreateTransactionForm
            workspaceId={workspaceId}
            accounts={accountOptions}
            categories={categoryOptions}
            clients={clients.map((c) => ({ id: String(c._id), name: c.name }))}
            projects={projects.map((p) => ({ id: String(p._id), name: p.name }))}
            ocrReceipts={plan.ocrReceipts}
            aiCategory={plan.aiCategory}
          />

          <CreateTransferForm workspaceId={workspaceId} accounts={accountOptions} />
        </>
      ) : (
        <p className="rounded-xl border border-[#E4DFD3] bg-[#F3F0E8]/50 px-4 py-3 text-sm text-neutral-600">
          {t("viewerReadOnly")}
        </p>
      )}

      <TransactionFiltersForm
        accounts={accountOptions}
        categories={categoryOptions}
        currentFilters={rawParams}
      />

      <TransactionList
        transactions={transactionsResult.items}
        workspaceId={workspaceId}
        accountCurrencies={accountCurrencies}
        accounts={accountOptions.map(({ id, name }) => ({ id, name }))}
        categories={categoryOptions}
      />

      <TransferList
        transfers={transfers}
        workspaceId={workspaceId}
        currency={activeWorkspace.currency}
      />

      <TransactionPagination
        page={transactionsResult.page}
        totalPages={transactionsResult.totalPages}
        searchParams={rawParams}
      />
    </div>
  );
}
