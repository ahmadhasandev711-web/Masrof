"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { formatMoney, fromMinorUnits } from "@/lib/money";
import { ArchiveTransactionButton } from "@/features/transactions/components/archive-transaction-button";
import {
  EditTransactionForm,
  type EditableTransaction,
} from "@/features/transactions/components/edit-transaction-form";
import { useLocale, useTranslations } from "next-intl";
import { CategoryIcon } from "@/components/ui/app-icons";
import type { CategoryOption } from "@/features/categories/map-options";

type AccountOption = { id: string; name: string };

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
    categorySlug?: string | null;
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

function formatDate(date: Date | string, locale: string = "ar") {
  const targetLocale = locale.startsWith("en") ? "en-US" : "ar-EG-u-nu-latn";
  return new Intl.DateTimeFormat(targetLocale, {
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
  const locale = useLocale();
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

  return (
    <li className="flex flex-col gap-2.5 rounded-2xl border border-neutral-200/80 bg-white p-3.5 shadow-xs transition hover:border-neutral-300 sm:flex-row sm:items-center sm:justify-between sm:p-4">
      {/* Left: Category Icon & Details */}
      <div className="flex min-w-0 items-start gap-3 sm:items-center">
        <div
          className={`flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl ${
            isIncome
              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
              : "bg-neutral-100 text-neutral-700 border border-neutral-200/60"
          }`}
        >
          <CategoryIcon
            slug={transaction.categorySlug}
            kind={transaction.type}
            className="h-5 w-5"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 sm:justify-start">
            <p className="truncate text-sm font-bold text-neutral-900">
              {transaction.description || transaction.categoryName || tShared("none")}
            </p>
            {/* Mobile Amount: Placed at top-right of card for quick glance */}
            <span
              className={`sm:hidden shrink-0 font-mono text-sm font-bold tabular-nums ${
                isIncome ? "text-emerald-700" : "text-rose-600"
              }`}
            >
              {isIncome ? "+" : "-"}
              {formatMoney(transaction.amountMinor, { currency, locale })}
            </span>
          </div>

          {/* Metadata badges & details */}
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-500">
            <span className="font-semibold text-neutral-700">{transaction.categoryName}</span>
            <span>·</span>
            <span className="text-neutral-600">{transaction.accountName}</span>
            <span>·</span>
            <span className="text-neutral-400">{formatDate(transaction.transactionDate, locale)}</span>
            {transaction.clientName && (
              <span className="rounded-md bg-blue-50 px-1.5 py-0.5 font-medium text-blue-700">
                 {transaction.clientName}
              </span>
            )}
            {transaction.projectName && (
              <span className="rounded-md bg-purple-50 px-1.5 py-0.5 font-medium text-purple-700">
                 {transaction.projectName}
              </span>
            )}
            {transaction.attachmentUrl && (
              <a
                href={transaction.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 font-medium text-amber-800 hover:underline"
              >
                 {transaction.attachmentName ?? tForm("receipt")}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Right: Desktop Amount & Action Buttons */}
      <div className="flex shrink-0 items-center justify-between border-t border-neutral-100 pt-2 sm:border-0 sm:pt-0 sm:justify-end gap-3">
        {/* Desktop Amount */}
        <span
          className={`hidden sm:inline-block font-mono text-base font-bold tabular-nums ${
            isIncome ? "text-emerald-700" : "text-rose-600"
          }`}
        >
          {isIncome ? "+" : "-"}
          {formatMoney(transaction.amountMinor, { currency, locale })}
        </span>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 ms-auto sm:ms-0">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded-lg px-2.5 py-1 text-xs font-semibold text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
          >
            {tForm("editTitle")}
          </button>
          <ArchiveTransactionButton transactionId={transaction.id} workspaceId={workspaceId} />
        </div>
      </div>

      <Modal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        title={tForm("editTitle")}
        maxWidthClassName="max-w-xl"
      >
        <EditTransactionForm
          transaction={editable}
          workspaceId={workspaceId}
          accounts={accounts}
          categories={categories}
          onCancel={() => setIsEditing(false)}
          onSuccess={() => setIsEditing(false)}
        />
      </Modal>
    </li>
  );
}
