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
import { TransactionCreationManager } from "@/features/transactions/components/transaction-creation-manager";
import { TransactionSummaryCards } from "@/features/transactions/components/transaction-summary-cards";
import { TransactionTabs } from "@/features/transactions/components/transaction-tabs";
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
  const [{ plan }, access] = await Promise.all([
    getWorkspacePlanContext(session.user.id, workspaceId),
    getWorkspaceAccess(session.user.id, workspaceId),
  ]);
  const canWrite = canWorkspaceWrite(access.membership.role);

  const rawParams = await searchParams;
  const activeTab = rawParams.tab === "transfers" ? "transfers" : "transactions";

  const isExplicitAll = rawParams.datePreset === "all";
  const hasExplicitDate = Boolean(rawParams.dateFrom || rawParams.dateTo);

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const effectiveDateFrom = isExplicitAll ? undefined : (rawParams.dateFrom ?? (hasExplicitDate ? undefined : todayStr));
  const effectiveDateTo = isExplicitAll ? undefined : (rawParams.dateTo ?? (hasExplicitDate ? undefined : todayStr));
  const effectiveDatePreset = isExplicitAll
    ? "all"
    : rawParams.datePreset ?? (!hasExplicitDate ? "today" : undefined);

  const filters = transactionFiltersSchema.parse({
    workspaceId,
    type: rawParams.type || undefined,
    accountId: rawParams.accountId || undefined,
    categoryId: rawParams.categoryId || undefined,
    dateFrom: effectiveDateFrom || undefined,
    dateTo: effectiveDateTo || undefined,
    search: rawParams.search || undefined,
    page: rawParams.page || 1,
    pageSize: rawParams.pageSize || 20,
  });

  const [accounts, categories, transactionsResult, transfers, clients, projects] = await Promise.all([
    listAccountsForWorkspace(workspaceId),
    listCategoriesForWorkspace(workspaceId),
    listTransactions(filters),
    activeTab === "transfers" ? listTransfersForWorkspace(workspaceId) : Promise.resolve([]),
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

  const clientOptions = clients.map((c) => ({
    id: String(c._id),
    name: c.name,
    phone: c.phone,
  }));

  const projectOptions = projects.map((p) => ({
    id: String(p._id),
    name: p.name,
  }));

  return (
    <div className="flex w-full max-w-5xl flex-col gap-5">
      {/* 1. Header with Title & Quick Action Modals */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl">{t("title")}</h1>
          <p className="text-xs text-neutral-500 mt-0.5">{activeWorkspace.name}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {plan.csvExport ? (
            <ExportTransactionsExcelButton
              workspaceId={workspaceId}
              filters={{
                type: rawParams.type,
                accountId: rawParams.accountId,
                categoryId: rawParams.categoryId,
                dateFrom: effectiveDateFrom,
                dateTo: effectiveDateTo,
                search: rawParams.search,
              }}
            />
          ) : null}

          {canWrite ? (
            <TransactionCreationManager
              workspaceId={workspaceId}
              accounts={accountOptions}
              categories={categoryOptions}
              clients={clientOptions}
              projects={projectOptions}
              defaultProjectId={rawParams.projectId}
              ocrReceipts={plan.ocrReceipts}
              aiCategory={plan.aiCategory}
              canWrite={canWrite}
            />
          ) : (
            <span className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs text-neutral-600">
              {t("viewerReadOnly")}
            </span>
          )}
        </div>
      </div>

      {/* 2. Top Summary Metric Cards */}
      <TransactionSummaryCards
        totalIncome={transactionsResult.summary.totalIncome}
        totalExpense={transactionsResult.summary.totalExpense}
        net={transactionsResult.summary.net}
        totalCount={transactionsResult.total}
        currency={activeWorkspace.currency}
      />

      {/* 3. Ledger vs Transfers Tabs */}
      <TransactionTabs
        activeTab={activeTab}
        transactionsCount={transactionsResult.total}
        transfersCount={transfers.length}
        searchParams={rawParams}
      />

      {/* 4. Tab Content */}
      {activeTab === "transfers" ? (
        <TransferList
          transfers={transfers}
          workspaceId={workspaceId}
          currency={activeWorkspace.currency}
        />
      ) : (
        <>
          {/* Smart Filter Bar */}
          <TransactionFiltersForm
            accounts={accountOptions}
            categories={categoryOptions}
            currentFilters={{
              ...rawParams,
              dateFrom: effectiveDateFrom,
              dateTo: effectiveDateTo,
              datePreset: effectiveDatePreset,
            }}
          />

          {/* Transactions List */}
          <TransactionList
            transactions={transactionsResult.items}
            workspaceId={workspaceId}
            accountCurrencies={accountCurrencies}
            accounts={accountOptions.map(({ id, name }) => ({ id, name }))}
            categories={categoryOptions}
          />

          {/* Pagination Bar */}
          <TransactionPagination
            page={transactionsResult.page}
            totalPages={transactionsResult.totalPages}
            totalItems={transactionsResult.total}
            pageSize={transactionsResult.pageSize}
            searchParams={rawParams}
          />
        </>
      )}
    </div>
  );
}
