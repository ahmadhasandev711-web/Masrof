"use client";

import { useTransition } from "react";
import { formatMoney } from "@/lib/money";
import { archiveTransferAction } from "@/features/transfers/actions/archive-transfer";
import type { TransferListItem } from "@/features/transfers/types";
import { useLocale, useTranslations } from "next-intl";

function formatDate(date: string, locale: string = "ar") {
  const targetLocale = locale.startsWith("en") ? "en-US" : "ar-EG-u-nu-latn";
  return new Intl.DateTimeFormat(targetLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function TransferList({
  transfers,
  workspaceId,
  currency,
  canWrite = true,
}: {
  transfers: TransferListItem[];
  workspaceId: string;
  currency: string;
  canWrite?: boolean;
}) {
  const tEmpty = useTranslations("empty");
  const locale = useLocale();

  if (transfers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white p-8 sm:p-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 text-2xl mb-3 shadow-2xs">
          ⇄
        </div>
        <p className="font-bold text-neutral-900 text-base">{tEmpty("noTransfers")}</p>
        <p className="mt-1 text-xs text-neutral-500 max-w-sm">
          {locale === "ar"
            ? "يمكنك نقل الأموال بسهولة بين حساباتك البنكية والخزائن النقدية وتوثيقها هنا بنقرة واحدة."
            : "Easily move money between bank accounts and cash vaults to track liquidity accurately."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <ul className="flex flex-col gap-2.5">
        {transfers.map((transfer) => (
          <TransferRow
            key={transfer._id}
            transfer={transfer}
            workspaceId={workspaceId}
            currency={currency}
            canWrite={canWrite}
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
  canWrite = true,
}: {
  transfer: TransferListItem;
  workspaceId: string;
  currency: string;
  canWrite?: boolean;
}) {
  const tTransfer = useTranslations("forms.transfer");
  const tCommon = useTranslations("common");
  const tConfirm = useTranslations("confirm");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-neutral-200/80 bg-white p-3.5 sm:p-4 shadow-xs transition hover:border-neutral-300 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-neutral-900">
            {transfer.description || tTransfer("title")}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-neutral-500">
            <span className="font-medium text-neutral-700">{transfer.fromAccountName}</span>
            <span>→</span>
            <span className="font-medium text-neutral-700">{transfer.toAccountName}</span>
            <span>·</span>
            <span>{formatDate(transfer.transferDate, locale)}</span>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
        <span className="font-mono text-base font-bold tabular-nums text-blue-700">
          {formatMoney(transfer.amount, { currency, locale })}
        </span>
        {canWrite && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              if (!confirm(tConfirm("deleteTransfer"))) return;
              startTransition(() => archiveTransferAction(transfer._id, workspaceId));
            }}
            className="rounded-lg px-2.5 py-1 text-xs font-semibold text-neutral-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
          >
            {tCommon("cancel")}
          </button>
        )}
      </div>
    </li>
  );
}
