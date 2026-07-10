"use client";

import { useTransition } from "react";
import { formatMoney } from "@/lib/money";
import { archiveTransferAction } from "@/features/transfers/actions/archive-transfer";
import type { TransferListItem } from "@/features/transfers/types";
import { useTranslations } from "next-intl";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function TransferList({
  transfers,
  workspaceId,
  currency,
}: {
  transfers: TransferListItem[];
  workspaceId: string;
  currency: string;
}) {
  const tTransfer = useTranslations("forms.transfer");
  if (transfers.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-neutral-600">{tTransfer("title")}</h3>
      <ul className="flex flex-col gap-2">
        {transfers.map((transfer) => (
          <TransferRow
            key={transfer._id}
            transfer={transfer}
            workspaceId={workspaceId}
            currency={currency}
          />
        ))}
      </ul>
    </div>
  );
}

function TransferRow({
  transfer,
  workspaceId,
  currency,
}: {
  transfer: TransferListItem;
  workspaceId: string;
  currency: string;
}) {
  const tTransfer = useTranslations("forms.transfer");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  return (
    <li className="flex items-center justify-between rounded-xl border border-blue-100 bg-white px-4 py-3 shadow-sm">
      <div>
        <p className="font-medium text-neutral-900">
          {transfer.description || tTransfer("title")}
        </p>
        <p className="text-xs text-neutral-500">
          {transfer.fromAccountName} → {transfer.toAccountName} ·{" "}
          {formatDate(transfer.transferDate)}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-semibold text-blue-700">
          {formatMoney(transfer.amount, { currency })}
        </span>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            if (!confirm("Cancel this transfer?")) return;
            startTransition(() => archiveTransferAction(transfer._id, workspaceId));
          }}
          className="text-sm text-neutral-400 transition hover:text-red-600 disabled:opacity-60"
        >
          {tCommon("cancel")}
        </button>
      </div>
    </li>
  );
}
