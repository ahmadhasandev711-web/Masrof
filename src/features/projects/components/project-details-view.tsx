"use client";

import Link from "next/link";
import { useState } from "react";
import { formatMoney } from "@/lib/money";
import type { ProjectFinancialDetailsView } from "@/features/projects/project-details-data";
import { useTranslations } from "next-intl";

function formatDate(isoDate: string | null) {
  if (!isoDate) return "—";
  return new Intl.DateTimeFormat("ar-EG", {
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
            className="inline-flex items-center text-xs font-medium text-neutral-500 hover:text-neutral-800"
          >
            {tPages("backToProjects")}
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-neutral-900">{project.name}</h1>
            <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
              {statusLabel}
            </span>
            {summary.profitMargin != null && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                  summary.netProfit >= 0
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-red-50 text-red-800 border-red-200"
                }`}
              >
                {summary.profitMargin}% {tPages("margin")}
              </span>
            )}
            {summary.isOverBudget && (
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 border border-red-200">
                {tPages("overBudgetWarning")}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            {client ? (
              <>
                <span className="text-neutral-400">العميل:</span>{" "}
                <Link
                  href={`/print/statement/${client.id}`}
                  className="font-medium text-neutral-800 hover:text-emerald-700 hover:underline"
                >
                  {client.name}
                </Link>
              </>
            ) : (
              "بدون عميل محدد"
            )}{" "}
            · <span className="text-neutral-400">تاريخ الاستحقاق:</span> {formatDate(project.dueDate)}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/dashboard/invoices?projectId=${project.id}${client ? `&clientId=${client.id}` : ""}`}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-emerald-800"
          >
            {tPages("createInvoice")}
          </Link>
          <Link
            href={`/dashboard/transactions?projectId=${project.id}`}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-xs font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50"
          >
            {tPages("recordExpense")}
          </Link>
        </div>
      </div>

      {/* Description if present */}
      {project.description && (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 text-xs text-neutral-600">
          <span className="font-semibold text-neutral-800">وصف المشروع:</span> {project.description}
        </div>
      )}

      {/* Financial KPI Summary Cards */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-neutral-500">{tPages("expected")}</p>
          <p className="mt-1 text-lg font-bold text-neutral-900">
            {summary.expectedAmount != null
              ? formatMoney(summary.expectedAmount, { currency })
              : "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-neutral-500">{tPages("invoiced")}</p>
          <p className="mt-1 text-lg font-bold text-sky-900">
            {formatMoney(summary.invoicedTotal, { currency })}
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-neutral-500">{tPages("collected")}</p>
          <p className="mt-1 text-lg font-bold text-emerald-700">
            {formatMoney(summary.incomeTotal, { currency })}
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-neutral-500">{tPages("costs")}</p>
          <p className="mt-1 text-lg font-bold text-rose-700">
            {formatMoney(summary.expenseTotal, { currency })}
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-neutral-500">{tPages("netProfit")}</p>
          <p
            className={`mt-1 text-lg font-bold ${
              summary.netProfit >= 0 ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {formatMoney(summary.netProfit, { currency })}
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-neutral-500">{tPages("profitMargin")}</p>
          <p
            className={`mt-1 text-lg font-bold ${
              (summary.profitMargin ?? 0) >= 0 ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {summary.profitMargin != null ? `${summary.profitMargin}%` : "—"}
          </p>
        </div>
      </section>

      {/* Progress Bars (Collection & Budget Consumption) */}
      <section className="grid grid-cols-1 gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:grid-cols-2">
        <div>
          <div className="flex items-center justify-between text-xs text-neutral-600">
            <span>{tPages("collectionProgress")}</span>
            <span className="font-semibold text-neutral-900">
              {summary.collectionProgressPercent}%
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full bg-emerald-600 transition-all"
              style={{ width: `${Math.min(100, summary.collectionProgressPercent)}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-neutral-400">
            محصّل {formatMoney(summary.incomeTotal, { currency })} من {formatMoney(summary.invoicedTotal, { currency })} مفوتر
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs text-neutral-600">
            <span>{tPages("budgetConsumption")}</span>
            <span
              className={`font-semibold ${
                summary.isOverBudget ? "text-rose-700" : "text-neutral-900"
              }`}
            >
              {summary.budgetBurnPercent != null ? `${summary.budgetBurnPercent}%` : "—"}
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className={`h-full transition-all ${
                summary.isOverBudget ? "bg-rose-600" : "bg-sky-600"
              }`}
              style={{ width: `${Math.min(100, summary.budgetBurnPercent ?? 0)}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-neutral-400">
            {summary.expectedAmount != null
              ? `مصروف ${formatMoney(summary.expenseTotal, { currency })} من ${formatMoney(summary.expectedAmount, { currency })} متوقع`
              : "لم يتم تحديد ميزانية متوقعة"}
          </p>
        </div>
      </section>

      {/* Tabs */}
      <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="flex border-b border-neutral-200 bg-neutral-50 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("invoices")}
            className={`px-5 py-3 border-b-2 transition ${
              activeTab === "invoices"
                ? "border-emerald-600 bg-white text-emerald-800"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            {tPages("invoicesSection")} ({invoices.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("expenses")}
            className={`px-5 py-3 border-b-2 transition ${
              activeTab === "expenses"
                ? "border-emerald-600 bg-white text-emerald-800"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            {tPages("expensesSection")} ({expenses.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("income")}
            className={`px-5 py-3 border-b-2 transition ${
              activeTab === "income"
                ? "border-emerald-600 bg-white text-emerald-800"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            سجل المقبوضات ({incomeTxs.length})
          </button>
        </div>

        <div className="p-4">
          {activeTab === "invoices" && (
            invoices.length === 0 ? (
              <p className="py-8 text-center text-xs text-neutral-400">{tPages("noInvoices")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-right text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-500">
                      <th className="pb-2">رقم الفاتورة</th>
                      <th className="pb-2">تاريخ الإصدار</th>
                      <th className="pb-2">الاستحقاق</th>
                      <th className="pb-2 text-left">الإجمالي</th>
                      <th className="pb-2 text-left">المحصل</th>
                      <th className="pb-2 text-left">المتبقي</th>
                      <th className="pb-2 text-center">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-neutral-50/60">
                        <td className="py-2.5 font-semibold text-neutral-900">
                          <Link
                            href={`/print/invoice/${inv.id}`}
                            className="hover:text-emerald-700 hover:underline"
                          >
                            {inv.invoiceNumber}
                          </Link>
                        </td>
                        <td className="py-2.5 text-neutral-600">{formatDate(inv.issueDate)}</td>
                        <td className="py-2.5 text-neutral-500">{formatDate(inv.dueDate)}</td>
                        <td className="py-2.5 text-left font-medium text-neutral-900">
                          {formatMoney(inv.total, { currency })}
                        </td>
                        <td className="py-2.5 text-left font-medium text-emerald-700">
                          {formatMoney(inv.paidAmount, { currency })}
                        </td>
                        <td className="py-2.5 text-left font-medium text-amber-800">
                          {inv.remainingAmount > 0 ? formatMoney(inv.remainingAmount, { currency }) : "—"}
                        </td>
                        <td className="py-2.5 text-center">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              inv.financialStatus === "paid"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : inv.financialStatus === "partially_paid"
                                ? "bg-sky-50 text-sky-800 border border-sky-200"
                                : "bg-neutral-100 text-neutral-600"
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
            )
          )}

          {activeTab === "expenses" && (
            expenses.length === 0 ? (
              <p className="py-8 text-center text-xs text-neutral-400">{tPages("noExpenses")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-right text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-500">
                      <th className="pb-2">التاريخ</th>
                      <th className="pb-2">التصنيف</th>
                      <th className="pb-2">البيان / الوصف</th>
                      <th className="pb-2">الحساب</th>
                      <th className="pb-2 text-left">المبلغ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {expenses.map((tx) => (
                      <tr key={tx.id} className="hover:bg-neutral-50/60">
                        <td className="py-2.5 text-neutral-600">{formatDate(tx.transactionDate)}</td>
                        <td className="py-2.5 font-medium text-neutral-800">
                          {tx.categoryIcon ? `${tx.categoryIcon} ` : ""}
                          {tx.categoryName}
                        </td>
                        <td className="py-2.5 text-neutral-600">{tx.description || tx.notes || "—"}</td>
                        <td className="py-2.5 text-neutral-500">{tx.accountName}</td>
                        <td className="py-2.5 text-left font-bold text-rose-700">
                          {formatMoney(tx.amount, { currency: tx.accountCurrency || currency })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {activeTab === "income" && (
            incomeTxs.length === 0 ? (
              <p className="py-8 text-center text-xs text-neutral-400">لا توجد مقبوضات مسجلة لهذا المشروع بعد.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-right text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-500">
                      <th className="pb-2">التاريخ</th>
                      <th className="pb-2">التصنيف</th>
                      <th className="pb-2">البيان / الوصف</th>
                      <th className="pb-2">حساب الإيداع</th>
                      <th className="pb-2 text-left">المبلغ المحصل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {incomeTxs.map((tx) => (
                      <tr key={tx.id} className="hover:bg-neutral-50/60">
                        <td className="py-2.5 text-neutral-600">{formatDate(tx.transactionDate)}</td>
                        <td className="py-2.5 font-medium text-neutral-800">
                          {tx.categoryIcon ? `${tx.categoryIcon} ` : ""}
                          {tx.categoryName}
                        </td>
                        <td className="py-2.5 text-neutral-600">{tx.description || tx.notes || "—"}</td>
                        <td className="py-2.5 text-neutral-500">{tx.accountName}</td>
                        <td className="py-2.5 text-left font-bold text-emerald-700">
                          {formatMoney(tx.amount, { currency: tx.accountCurrency || currency })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}
