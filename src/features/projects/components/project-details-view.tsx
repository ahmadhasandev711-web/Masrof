"use client";

import Link from "next/link";
import { useState } from "react";
import { formatMoney } from "@/lib/money";
import type { ProjectFinancialDetailsView } from "@/features/projects/project-details-data";
import { useTranslations, useLocale } from "next-intl";
import { CategoryIcon } from "@/components/ui/app-icons";

function formatDate(isoDate: string | null, locale = "ar") {
  if (!isoDate) return "—";
  const targetLocale = locale.startsWith("en") ? "en-US" : "ar-EG-u-nu-latn";
  return new Intl.DateTimeFormat(targetLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(isoDate));
}

export function ProjectDetailsView({
  data,
  currency,
}: {
  data: ProjectFinancialDetailsView;
  currency: string;
}) {
  const { project, client, summary, invoices, transactions } = data;
  const [activeTab, setActiveTab] = useState<"invoices" | "expenses" | "income">("invoices");

  const locale = useLocale();
  const tPages = useTranslations("pages.projects");
  const tStatus = useTranslations("status");
  const tInvoices = useTranslations("forms.invoice");

  const expenses = transactions.filter((tx) => tx.type === "expense");
  const incomeTxs = transactions.filter((tx) => tx.type === "income");

  const statusLabel =
    project.status === "on_hold" ? tStatus("paused") : tStatus(project.status);

  return (
    <div className="flex w-full max-w-4xl flex-col gap-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard/projects"
            className="inline-flex items-center text-xs font-medium text-neutral-500 dark:text-[#9AA39F] hover:text-neutral-800 dark:hover:text-[#ECEAE4]"
          >
            {tPages("backToProjects")}
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-[#ECEAE4]">{project.name}</h1>
            <span className="rounded-full bg-neutral-100 dark:bg-[#1E2824] px-2.5 py-0.5 text-xs font-medium text-neutral-700 dark:text-[#ECEAE4]">
              {statusLabel}
            </span>
            {summary.profitMargin != null && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                  summary.netProfit >= 0
                    ? "bg-emerald-50 dark:bg-[#0F2E24] text-emerald-800 dark:text-[#34D399] border-emerald-200 dark:border-[#34D399]/30"
                    : "bg-red-50 dark:bg-rose-500/15 text-red-800 dark:text-rose-400 border-red-200 dark:border-rose-500/30"
                }`}
              >
                {summary.profitMargin}% {tPages("margin")}
              </span>
            )}
            {summary.isOverBudget && (
              <span className="rounded-full bg-red-100 dark:bg-rose-500/20 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:text-rose-300 border border-red-200 dark:border-rose-500/30">
                {tPages("overBudgetWarning")}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-neutral-500 dark:text-[#9AA39F]">
            {client ? (
              <>
                <span className="text-neutral-400 dark:text-[#66706B]">{tPages("clientLabel")}</span>{" "}
                <Link
                  href={`/print/statement/${client.id}`}
                  className="font-medium text-neutral-800 dark:text-[#ECEAE4] hover:text-emerald-700 dark:hover:text-[#34D399] hover:underline"
                >
                  {client.name}
                </Link>
              </>
            ) : (
              tPages("noClient")
            )}{" "}
            · <span className="text-neutral-400 dark:text-[#66706B]">{tPages("dueDateLabel")}</span> {formatDate(project.dueDate, locale)}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/dashboard/invoices?projectId=${project.id}${client ? `&clientId=${client.id}` : ""}`}
            className="rounded-lg bg-emerald-700 dark:bg-[#10B981] px-4 py-2 text-xs font-medium text-white dark:text-[#04231A] shadow-sm transition hover:bg-emerald-800 dark:hover:bg-[#34D399]"
          >
            {tPages("createInvoice")}
          </Link>
          <Link
            href={`/dashboard/transactions?projectId=${project.id}`}
            className="rounded-lg border border-neutral-300 dark:border-[#26302C] bg-white dark:bg-[#1E2824] px-4 py-2 text-xs font-medium text-neutral-700 dark:text-[#ECEAE4] shadow-sm transition hover:bg-neutral-50 dark:hover:bg-[#26302C]"
          >
            {tPages("recordExpense")}
          </Link>
        </div>
      </div>

      {/* Description if present */}
      {project.description && (
        <div className="rounded-xl border border-neutral-200 dark:border-[#26302C] bg-neutral-50/70 dark:bg-[#161E1B] p-4 text-xs text-neutral-600 dark:text-[#9AA39F]">
          <span className="font-semibold text-neutral-800 dark:text-[#ECEAE4]">{tPages("projectDescription")}</span> {project.description}
        </div>
      )}

      {/* Financial KPI Summary Cards */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 dark:border-[#26302C] bg-white dark:bg-[#161E1B] p-4 shadow-sm">
          <p className="text-xs text-neutral-500 dark:text-[#9AA39F]">{tPages("expected")}</p>
          <p className="mt-1 text-lg font-bold text-neutral-900 dark:text-[#ECEAE4]">
            {summary.expectedAmount != null
              ? formatMoney(summary.expectedAmount, { currency })
              : "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 dark:border-[#26302C] bg-white dark:bg-[#161E1B] p-4 shadow-sm">
          <p className="text-xs text-neutral-500 dark:text-[#9AA39F]">{tPages("invoiced")}</p>
          <p className="mt-1 text-lg font-bold text-sky-900 dark:text-sky-300">
            {formatMoney(summary.invoicedTotal, { currency })}
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 dark:border-[#26302C] bg-white dark:bg-[#161E1B] p-4 shadow-sm">
          <p className="text-xs text-neutral-500 dark:text-[#9AA39F]">{tPages("collected")}</p>
          <p className="mt-1 text-lg font-bold text-emerald-700 dark:text-[#34D399]">
            {formatMoney(summary.incomeTotal, { currency })}
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 dark:border-[#26302C] bg-white dark:bg-[#161E1B] p-4 shadow-sm">
          <p className="text-xs text-neutral-500 dark:text-[#9AA39F]">{tPages("costs")}</p>
          <p className="mt-1 text-lg font-bold text-rose-700 dark:text-rose-400">
            {formatMoney(summary.expenseTotal, { currency })}
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 dark:border-[#26302C] bg-white dark:bg-[#161E1B] p-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-neutral-500 dark:text-[#9AA39F]">{tPages("netProfit")}</p>
              <span className="text-[10px] text-neutral-400 dark:text-[#66706B] font-medium">
                {summary.incomeTotal < summary.invoicedTotal ? tPages("cashCollectedTag") : tPages("finalNetTag")}
              </span>
            </div>
            <p
              className={`mt-1 text-lg font-bold ${
                summary.netProfit >= 0 ? "text-emerald-700 dark:text-[#34D399]" : "text-rose-700 dark:text-rose-400"
              }`}
            >
              {formatMoney(summary.netProfit, { currency })}
            </p>
          </div>
          {summary.invoicedTotal > summary.incomeTotal && (
            <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-[#26302C] text-[11px] text-neutral-600 dark:text-[#9AA39F]">
              <span>{tPages("expectedOnCollectionLabel")} </span>
              <strong className="text-emerald-700 dark:text-[#34D399] font-bold">
                {formatMoney(summary.invoicedTotal - summary.expenseTotal, { currency })}
              </strong>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-neutral-200 dark:border-[#26302C] bg-white dark:bg-[#161E1B] p-4 shadow-sm">
          <p className="text-xs text-neutral-500 dark:text-[#9AA39F]">{tPages("profitMargin")}</p>
          <p
            className={`mt-1 text-lg font-bold ${
              (summary.profitMargin ?? 0) >= 0 ? "text-emerald-700 dark:text-[#34D399]" : "text-rose-700 dark:text-rose-400"
            }`}
          >
            {summary.profitMargin != null ? `${summary.profitMargin}%` : "—"}
          </p>
        </div>
      </section>

      {/* Progress Bars (Collection & Budget Consumption) */}
      <section className="grid grid-cols-1 gap-4 rounded-2xl border border-neutral-200 dark:border-[#26302C] bg-white dark:bg-[#161E1B] p-5 shadow-sm sm:grid-cols-2">
        <div>
          <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-[#9AA39F]">
            <span>{tPages("collectionProgress")}</span>
            <span className="font-semibold text-neutral-900 dark:text-[#ECEAE4]">
              {summary.collectionProgressPercent}%
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-[#1E2824]">
            <div
              className="h-full bg-emerald-600 dark:bg-[#10B981] transition-all"
              style={{ width: `${Math.min(100, summary.collectionProgressPercent)}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-neutral-400 dark:text-[#66706B]">
            {tPages("collectedOutOfInvoiced", {
              collected: formatMoney(summary.incomeTotal, { currency }),
              invoiced: formatMoney(summary.invoicedTotal, { currency }),
            })}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-[#9AA39F]">
            <span>{tPages("budgetConsumption")}</span>
            <span
              className={`font-semibold ${
                summary.isOverBudget ? "text-rose-700 dark:text-rose-400" : "text-neutral-900 dark:text-[#ECEAE4]"
              }`}
            >
              {summary.budgetBurnPercent != null ? `${summary.budgetBurnPercent}%` : "—"}
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-[#1E2824]">
            <div
              className={`h-full transition-all ${
                summary.isOverBudget ? "bg-rose-600" : "bg-sky-600"
              }`}
              style={{ width: `${Math.min(100, summary.budgetBurnPercent ?? 0)}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-neutral-400 dark:text-[#66706B]">
            {summary.expectedAmount != null
              ? tPages("spentOutOfExpected", {
                  spent: formatMoney(summary.expenseTotal, { currency }),
                  expected: formatMoney(summary.expectedAmount, { currency }),
                })
              : tPages("noBudgetSet")}
          </p>
        </div>
      </section>

      {/* Tabs */}
      <section className="rounded-2xl border border-neutral-200 dark:border-[#26302C] bg-white dark:bg-[#161E1B] shadow-sm overflow-hidden">
        <div className="flex border-b border-neutral-200 dark:border-[#26302C] bg-neutral-50 dark:bg-[#1E2824] text-xs font-semibold overflow-x-auto whitespace-nowrap scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("invoices")}
            className={`px-4 py-3 sm:px-5 border-b-2 transition shrink-0 ${
              activeTab === "invoices"
                ? "border-emerald-600 dark:border-[#34D399] bg-white dark:bg-[#161E1B] text-emerald-800 dark:text-[#34D399]"
                : "border-transparent text-neutral-500 dark:text-[#9AA39F] hover:text-neutral-800 dark:hover:text-[#ECEAE4]"
            }`}
          >
            {tPages("invoicesSection")} ({invoices.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("expenses")}
            className={`px-4 py-3 sm:px-5 border-b-2 transition shrink-0 ${
              activeTab === "expenses"
                ? "border-emerald-600 dark:border-[#34D399] bg-white dark:bg-[#161E1B] text-emerald-800 dark:text-[#34D399]"
                : "border-transparent text-neutral-500 dark:text-[#9AA39F] hover:text-neutral-800 dark:hover:text-[#ECEAE4]"
            }`}
          >
            {tPages("expensesSection")} ({expenses.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("income")}
            className={`px-4 py-3 sm:px-5 border-b-2 transition shrink-0 ${
              activeTab === "income"
                ? "border-emerald-600 dark:border-[#34D399] bg-white dark:bg-[#161E1B] text-emerald-800 dark:text-[#34D399]"
                : "border-transparent text-neutral-500 dark:text-[#9AA39F] hover:text-neutral-800 dark:hover:text-[#ECEAE4]"
            }`}
          >
            {tPages("incomeSection")} ({incomeTxs.length})
          </button>
        </div>

        <div className="p-3.5 sm:p-5">
          {activeTab === "invoices" && (
            invoices.length === 0 ? (
              <p className="py-8 text-center text-xs text-neutral-400 dark:text-[#9AA39F]">{tPages("noInvoices")}</p>
            ) : (
              <>
                {/* Mobile Cards View */}
                <div className="flex flex-col gap-2.5 sm:hidden">
                  {invoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="flex flex-col gap-2 rounded-xl border border-neutral-200/90 dark:border-[#26302C] bg-white dark:bg-[#1E2824]/60 p-3.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Link
                          href={`/print/invoice/${inv.id}`}
                          className="font-bold text-neutral-900 dark:text-[#ECEAE4] hover:text-emerald-700 dark:hover:text-[#34D399] hover:underline text-xs"
                        >
                          {inv.invoiceNumber}
                        </Link>
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            inv.financialStatus === "paid"
                              ? "bg-emerald-50 dark:bg-[#0F2E24] text-emerald-800 dark:text-[#34D399] border border-emerald-200 dark:border-[#34D399]/30"
                              : inv.financialStatus === "partially_paid"
                              ? "bg-sky-50 dark:bg-sky-500/15 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30"
                              : "bg-neutral-100 dark:bg-[#26302C] text-neutral-600 dark:text-[#9AA39F]"
                          }`}
                        >
                          {tInvoices(`financialStatuses.${inv.financialStatus}`)}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 rounded-lg bg-neutral-50/80 dark:bg-[#1E2824] p-2 text-center text-[11px]">
                        <div>
                          <span className="block text-neutral-400 dark:text-[#9AA39F] text-[10px]">{tPages("total")}</span>
                          <strong className="font-semibold text-neutral-900 dark:text-[#ECEAE4]">
                            {formatMoney(inv.total, { currency })}
                          </strong>
                        </div>
                        <div>
                          <span className="block text-neutral-400 dark:text-[#9AA39F] text-[10px]">{tPages("paid")}</span>
                          <strong className="font-semibold text-emerald-700 dark:text-[#34D399]">
                            {formatMoney(inv.paidAmount, { currency })}
                          </strong>
                        </div>
                        <div>
                          <span className="block text-neutral-400 dark:text-[#9AA39F] text-[10px]">{tPages("remaining")}</span>
                          <strong className="font-semibold text-amber-800 dark:text-amber-300">
                            {inv.remainingAmount > 0 ? formatMoney(inv.remainingAmount, { currency }) : "—"}
                          </strong>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-neutral-400 dark:text-[#66706B] pt-1 border-t border-neutral-100 dark:border-[#26302C]">
                        <span>{tPages("issuedOn")} {formatDate(inv.issueDate, locale)}</span>
                        <span>{tPages("dueOn")} {formatDate(inv.dueDate, locale)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full min-w-[620px] border-collapse text-right text-xs">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-[#26302C] text-neutral-500 dark:text-[#9AA39F]">
                        <th className="pb-2">{tPages("invoiceNumber")}</th>
                        <th className="pb-2">{tPages("issueDate")}</th>
                        <th className="pb-2">{tPages("dueDate")}</th>
                        <th className="pb-2 text-left">{tPages("total")}</th>
                        <th className="pb-2 text-left">{tPages("paid")}</th>
                        <th className="pb-2 text-left">{tPages("remaining")}</th>
                        <th className="pb-2 text-center">{tPages("status")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-[#26302C]">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-neutral-50/60 dark:hover:bg-[#1E2824]/50">
                          <td className="py-2.5 font-semibold text-neutral-900 dark:text-[#ECEAE4]">
                            <Link
                              href={`/print/invoice/${inv.id}`}
                              className="hover:text-emerald-700 dark:hover:text-[#34D399] hover:underline"
                            >
                              {inv.invoiceNumber}
                            </Link>
                          </td>
                          <td className="py-2.5 text-neutral-600 dark:text-[#9AA39F]">{formatDate(inv.issueDate, locale)}</td>
                          <td className="py-2.5 text-neutral-500 dark:text-[#9AA39F]">{formatDate(inv.dueDate, locale)}</td>
                          <td className="py-2.5 text-left font-medium text-neutral-900 dark:text-[#ECEAE4]">
                            {formatMoney(inv.total, { currency })}
                          </td>
                          <td className="py-2.5 text-left font-medium text-emerald-700 dark:text-[#34D399]">
                            {formatMoney(inv.paidAmount, { currency })}
                          </td>
                          <td className="py-2.5 text-left font-medium text-amber-800 dark:text-amber-300">
                            {inv.remainingAmount > 0 ? formatMoney(inv.remainingAmount, { currency }) : "—"}
                          </td>
                          <td className="py-2.5 text-center">
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                inv.financialStatus === "paid"
                                  ? "bg-emerald-50 dark:bg-[#0F2E24] text-emerald-800 dark:text-[#34D399] border border-emerald-200 dark:border-[#34D399]/30"
                                  : inv.financialStatus === "partially_paid"
                                  ? "bg-sky-50 dark:bg-sky-500/15 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30"
                                  : "bg-neutral-100 dark:bg-[#26302C] text-neutral-600 dark:text-[#9AA39F]"
                              }`}
                            >
                              {tInvoices(`financialStatuses.${inv.financialStatus}`)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )
          )}

          {activeTab === "expenses" && (
            expenses.length === 0 ? (
              <p className="py-8 text-center text-xs text-neutral-400 dark:text-[#9AA39F]">{tPages("noExpenses")}</p>
            ) : (
              <>
                {/* Mobile Cards View */}
                <div className="flex flex-col gap-2 sm:hidden">
                  {expenses.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex flex-col gap-1.5 rounded-xl border border-neutral-200/90 dark:border-[#26302C] bg-white dark:bg-[#1E2824]/60 p-3 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CategoryIcon slug={tx.categorySlug} kind="expense" className="h-4 w-4 shrink-0" />
                          <div>
                            <p className="font-semibold text-xs text-neutral-900 dark:text-[#ECEAE4]">
                              {tx.description || tx.notes || tx.categoryName}
                            </p>
                            <p className="text-[10px] text-neutral-500 dark:text-[#9AA39F]">
                              {tx.categoryName} · {tx.accountName}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-xs text-rose-700 dark:text-rose-400 shrink-0">
                          -{formatMoney(tx.amount, { currency: tx.accountCurrency || currency })}
                        </span>
                      </div>
                      <div className="text-[10px] text-neutral-400 dark:text-[#66706B] pt-1 border-t border-neutral-100 dark:border-[#26302C] text-left">
                        {formatDate(tx.transactionDate, locale)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full min-w-[550px] border-collapse text-right text-xs">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-[#26302C] text-neutral-500 dark:text-[#9AA39F]">
                        <th className="pb-2">{tPages("date")}</th>
                        <th className="pb-2">{tPages("category")}</th>
                        <th className="pb-2">{tPages("description")}</th>
                        <th className="pb-2">{tPages("account")}</th>
                        <th className="pb-2 text-left">{tPages("amount")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-[#26302C]">
                      {expenses.map((tx) => (
                        <tr key={tx.id} className="hover:bg-neutral-50/60 dark:hover:bg-[#1E2824]/50">
                          <td className="py-2.5 text-neutral-600 dark:text-[#9AA39F]">{formatDate(tx.transactionDate, locale)}</td>
                          <td className="py-2.5 font-medium text-neutral-800 dark:text-[#ECEAE4]">
                            <span className="inline-flex items-center gap-1.5">
                              <CategoryIcon slug={tx.categorySlug} kind="expense" className="h-3.5 w-3.5" />
                              {tx.categoryName}
                            </span>
                          </td>
                          <td className="py-2.5 text-neutral-600 dark:text-[#9AA39F]">{tx.description || tx.notes || "—"}</td>
                          <td className="py-2.5 text-neutral-500 dark:text-[#9AA39F]">{tx.accountName}</td>
                          <td className="py-2.5 text-left font-bold text-rose-700 dark:text-rose-400">
                            {formatMoney(tx.amount, { currency: tx.accountCurrency || currency })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )
          )}

          {activeTab === "income" && (
            incomeTxs.length === 0 ? (
              <p className="py-8 text-center text-xs text-neutral-400 dark:text-[#9AA39F]">{tPages("noIncomeRecords")}</p>
            ) : (
              <>
                {/* Mobile Cards View */}
                <div className="flex flex-col gap-2 sm:hidden">
                  {incomeTxs.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex flex-col gap-1.5 rounded-xl border border-neutral-200/90 dark:border-[#26302C] bg-white dark:bg-[#1E2824]/60 p-3 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CategoryIcon slug={tx.categorySlug} kind="income" className="h-4 w-4 shrink-0" />
                          <div>
                            <p className="font-semibold text-xs text-neutral-900 dark:text-[#ECEAE4]">
                              {tx.description || tx.notes || tx.categoryName}
                            </p>
                            <p className="text-[10px] text-neutral-500 dark:text-[#9AA39F]">
                              {tx.categoryName} · {tPages("accountPrefix")} {tx.accountName}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-xs text-emerald-700 dark:text-[#34D399] shrink-0">
                          +{formatMoney(tx.amount, { currency: tx.accountCurrency || currency })}
                        </span>
                      </div>
                      <div className="text-[10px] text-neutral-400 dark:text-[#66706B] pt-1 border-t border-neutral-100 dark:border-[#26302C] text-left">
                        {formatDate(tx.transactionDate, locale)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full min-w-[550px] border-collapse text-right text-xs">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-[#26302C] text-neutral-500 dark:text-[#9AA39F]">
                        <th className="pb-2">{tPages("date")}</th>
                        <th className="pb-2">{tPages("category")}</th>
                        <th className="pb-2">{tPages("description")}</th>
                        <th className="pb-2">{tPages("depositAccount")}</th>
                        <th className="pb-2 text-left">{tPages("collectedAmount")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-[#26302C]">
                      {incomeTxs.map((tx) => (
                        <tr key={tx.id} className="hover:bg-neutral-50/60 dark:hover:bg-[#1E2824]/50">
                          <td className="py-2.5 text-neutral-600 dark:text-[#9AA39F]">{formatDate(tx.transactionDate, locale)}</td>
                          <td className="py-2.5 font-medium text-neutral-800 dark:text-[#ECEAE4]">
                            <span className="inline-flex items-center gap-1.5">
                              <CategoryIcon slug={tx.categorySlug} kind="income" className="h-3.5 w-3.5" />
                              {tx.categoryName}
                            </span>
                          </td>
                          <td className="py-2.5 text-neutral-600 dark:text-[#9AA39F]">{tx.description || tx.notes || "—"}</td>
                          <td className="py-2.5 text-neutral-500 dark:text-[#9AA39F]">{tx.accountName}</td>
                          <td className="py-2.5 text-left font-bold text-emerald-700 dark:text-[#34D399]">
                            {formatMoney(tx.amount, { currency: tx.accountCurrency || currency })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )
          )}
        </div>
      </section>
    </div>
  );
}
