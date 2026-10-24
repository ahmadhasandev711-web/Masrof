"use client";

import { formatMoney } from "@/lib/money";
import { useLocale, useTranslations } from "next-intl";

export function ClientSummaryCards({
  totalClients,
  clientsWithProjects,
  totalInvoiced,
  totalOutstanding,
  clientsWithDebt,
  currency,
}: {
  totalClients: number;
  clientsWithProjects: number;
  totalInvoiced: number;
  totalOutstanding: number;
  clientsWithDebt: number;
  currency: string;
}) {
  const t = useTranslations("pages.clients");
  const locale = useLocale();

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
      {/* 1. Total Clients */}
      <div className="flex flex-col justify-between rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/70 to-indigo-100/40 p-3.5 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-indigo-900">{t("totalClients")}</p>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-xs text-indigo-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </span>
        </div>
        <div className="mt-2">
          <p className="truncate text-base font-bold text-indigo-950 sm:text-xl font-mono tabular-nums">
            {totalClients} <span className="text-xs font-normal text-indigo-700 font-sans">{t("clientsUnit")}</span>
          </p>
          <p className="mt-0.5 text-[11px] text-indigo-600 truncate">
            {clientsWithProjects} {t("activeClientsUnit")}
          </p>
        </div>
      </div>

      {/* 2. Total Invoiced */}
      <div className="flex flex-col justify-between rounded-2xl border border-neutral-200/80 bg-gradient-to-br from-neutral-50/70 to-neutral-100/40 p-3.5 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-neutral-800">{t("totalInvoiced")}</p>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-500/10 text-xs text-neutral-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </span>
        </div>
        <div className="mt-2">
          <p className="truncate text-base font-bold text-neutral-900 sm:text-xl font-mono tabular-nums">
            {formatMoney(totalInvoiced, { currency, locale })}
          </p>
          <p className="mt-0.5 text-[11px] text-neutral-500 truncate">
            {t("invoicedAmount")}
          </p>
        </div>
      </div>

      {/* 3. Outstanding Receivables */}
      <div
        className={`flex flex-col justify-between rounded-2xl border p-3.5 sm:p-4 shadow-xs ${
          totalOutstanding > 0
            ? "border-rose-200/80 bg-gradient-to-br from-rose-50/70 to-rose-100/40"
            : "border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 to-emerald-100/40"
        }`}
      >
        <div className="flex items-center justify-between">
          <p
            className={`text-xs font-semibold ${
              totalOutstanding > 0 ? "text-rose-900" : "text-emerald-900"
            }`}
          >
            {t("outstandingReceivables")}
          </p>
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs ${
              totalOutstanding > 0
                ? "bg-rose-500/10 text-rose-700"
                : "bg-emerald-500/10 text-emerald-700"
            }`}
          >
            {totalOutstanding > 0 ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </span>
        </div>
        <div className="mt-2">
          <p
            className={`truncate text-base font-bold sm:text-xl font-mono tabular-nums ${
              totalOutstanding > 0 ? "text-rose-950" : "text-emerald-950"
            }`}
          >
            {formatMoney(totalOutstanding, { currency, locale })}
          </p>
          <p
            className={`mt-0.5 text-[11px] truncate ${
              totalOutstanding > 0 ? "text-rose-600" : "text-emerald-600"
            }`}
          >
            {totalOutstanding > 0 ? t("debtDue") : t("settledAccount")}
          </p>
        </div>
      </div>

      {/* 4. Clients with Debt */}
      <div className="flex flex-col justify-between rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 to-amber-100/40 p-3.5 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-amber-900">{t("clientsWithDebt")}</p>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-xs text-amber-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
        </div>
        <div className="mt-2">
          <p className="truncate text-base font-bold text-amber-950 sm:text-xl font-mono tabular-nums">
            {clientsWithDebt} <span className="text-xs font-normal text-amber-700 font-sans">{t("debtClientsUnit")}</span>
          </p>
          <p className="mt-0.5 text-[11px] text-amber-700 truncate">
            {totalClients > 0
              ? t("percentOfClients", {
                  percent: Math.round((clientsWithDebt / totalClients) * 100),
                })
              : "0%"}
          </p>
        </div>
      </div>
    </div>
  );
}
