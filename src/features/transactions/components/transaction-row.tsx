"use client";

import { useState } from "react";
import { formatMoney, fromMinorUnits } from "@/lib/money";
import { ArchiveTransactionButton } from "@/features/transactions/components/archive-transaction-button";
import {
  EditTransactionForm,
  type EditableTransaction,
} from "@/features/transactions/components/edit-transaction-form";
import { useTranslations } from "next-intl";

type AccountOption = { id: string; name: string };
type CategoryOption = { id: string; name: string; kind: "income" | "expense"; icon?: string | null };

type TransactionRowProps = {
  transaction: {
    id: string;
    type: "income" | "expense";
    amountMinor: number;
    transactionDate: Date | string;
    description?: string;
    notes?: string;
    accountId: string;
    accountName: string;
    categoryId: string;
    categoryName: string;
    categoryIcon?: string | null;
    clientName?: string | null;
    projectName?: string | null;
    attachmentUrl?: string | null;
    attachmentName?: string | null;
  };
  workspaceId: string;
  currency: string;
  accounts: AccountOption[];
  categories: CategoryOption[];
};

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function toIsoDate(date: Date | string) {
  return new Date(date).toISOString().slice(0, 10);
}

export function TransactionRow({
  transaction,
  workspaceId,
  currency,
  accounts,
  categories,
}: TransactionRowProps) {
  const tForm = useTranslations("forms.transaction");
  const tShared = useTranslations("forms.shared");
  const tCommon = useTranslations("common");
  const [isEditing, setIsEditing] = useState(false);
  const isIncome = transaction.type === "income";

  const editable: EditableTransaction = {
    id: transaction.id,
    type: transaction.type,
    amount: fromMinorUnits(transaction.amountMinor),
    transactionDate: toIsoDate(transaction.transactionDate),
    description: transaction.description ?? "",
    notes: transaction.notes ?? "",
    accountId: transaction.accountId,
    categoryId: transaction.categoryId,
  };

  if (isEditing) {
    return (
      <li className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
        <EditTransactionForm
          transaction={editable}
          workspaceId={workspaceId}
          accounts={accounts}
          categories={categories}
          onCancel={() => setIsEditing(false)}
          onSuccess={() => setIsEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="shrink-0 text-xl">{transaction.categoryIcon ?? "🏷️"}</span>
        <div className="min-w-0">
          <p className="truncate font-medium text-neutral-900">
            {transaction.description || transaction.categoryName || tShared("none")}
          </p>
          <p className="truncate text-xs text-neutral-500">
            {transaction.categoryName} · {transaction.accountName} ·{" "}
            {formatDate(transaction.transactionDate)}
            {transaction.clientName ? ` · ${transaction.clientName}` : ""}
            {transaction.projectName ? ` · ${transaction.projectName}` : ""}
          </p>
          {transaction.attachmentUrl && (
            <a
              href={transaction.attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 inline-block text-xs text-emerald-700 hover:underline"
            >
              📎 {transaction.attachmentName ?? tForm("receipt")}
            </a>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
        <span className={`font-semibold ${isIncome ? "text-emerald-700" : "text-red-600"}`}>
          {isIncome ? "+" : "-"}
          {formatMoney(transaction.amountMinor, { currency })}
        </span>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="text-sm text-neutral-400 transition hover:text-emerald-700"
        >
          {tForm("editTitle")}
        </button>
        <ArchiveTransactionButton transactionId={transaction.id} workspaceId={workspaceId} />
      </div>
    </li>
  );
}
