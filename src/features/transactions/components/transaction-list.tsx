import { TransactionRow } from "@/features/transactions/components/transaction-row";
import { getTranslations } from "next-intl/server";

type AccountOption = { id: string; name: string };
type CategoryOption = { id: string; name: string; kind: "income" | "expense"; icon?: string | null };

type PopulatedRef = { _id: unknown; name: string; icon?: string | null };

type TransactionItem = {
  _id: unknown;
  type: "income" | "expense";
  amount: number;
  transactionDate: Date | string;
  description?: string;
  notes?: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  accountId: PopulatedRef | unknown;
  categoryId: PopulatedRef | unknown;
  clientId?: PopulatedRef | unknown | null;
  projectId?: PopulatedRef | unknown | null;
};

export async function TransactionList({
  transactions,
  workspaceId,
  accountCurrencies,
  accounts,
  categories,
}: {
  transactions: TransactionItem[];
  workspaceId: string;
  accountCurrencies: Record<string, string>;
  accounts: AccountOption[];
  categories: CategoryOption[];
}) {
  const tEmpty = await getTranslations("empty");
  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-400">
        {tEmpty("noTransactions")}
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {transactions.map((tx) => {
        const account = tx.accountId as PopulatedRef;
        const category = tx.categoryId as PopulatedRef;
        const client =
          tx.clientId && typeof tx.clientId === "object" && "name" in tx.clientId
            ? (tx.clientId as PopulatedRef)
            : null;
        const project =
          tx.projectId && typeof tx.projectId === "object" && "name" in tx.projectId
            ? (tx.projectId as PopulatedRef)
            : null;

        return (
          <TransactionRow
            key={String(tx._id)}
            transaction={{
              id: String(tx._id),
              type: tx.type,
              amountMinor: tx.amount,
              transactionDate: tx.transactionDate,
              description: tx.description,
              notes: tx.notes,
              accountId: String(account._id),
              accountName: account.name,
              categoryId: String(category._id),
              categoryName: category.name,
              categoryIcon: category.icon,
              clientName: client?.name ?? null,
              projectName: project?.name ?? null,
              attachmentUrl: tx.attachmentUrl ?? null,
              attachmentName: tx.attachmentName ?? null,
            }}
            workspaceId={workspaceId}
            currency={accountCurrencies[String(account._id)] ?? "EGP"}
            accounts={accounts}
            categories={categories}
          />
        );
      })}
    </ul>
  );
}
