"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { formatMoney } from "@/lib/money";
import { archiveDebtAction } from "@/features/debts/actions/archive-debt";
import { RecordDebtPaymentDialog } from "@/features/debts/components/record-debt-payment-dialog";
import { DebtPaymentsDialog } from "@/features/debts/components/debt-payments-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToasts, ToastStack } from "@/components/ui/toast";
import type { DebtItem } from "@/features/debts/types";

export function DebtsList({
  debts,
  accounts,
  workspaceId,
  currency,
}: {
  debts: DebtItem[];
  accounts: { _id: string; name: string; currency?: string | null }[];
  workspaceId: string;
  currency: string;
}) {
  const t = useTranslations("forms.debts");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const formatOptions = {
    currency,
    locale: locale === "ar" ? "ar-EG" : "en-US",
  };
  const [filter, setFilter] = useState<"all" | "active" | "paid">("all");
  const [paymentTargetDebt, setPaymentTargetDebt] = useState<DebtItem | null>(null);
  const [historyTargetDebt, setHistoryTargetDebt] = useState<DebtItem | null>(null);
  const [archiveTargetDebt, setArchiveTargetDebt] = useState<DebtItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toasts, show: toast, dismiss } = useToasts();

  const filteredDebts = debts.filter((d) => {
    if (filter === "active") return d.status === "active";
    if (filter === "paid") return d.status === "paid";
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-xl bg-neutral-100 p-1 text-xs font-semibold text-neutral-600">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-lg px-3 py-1.5 transition ${
              filter === "all" ? "bg-white text-neutral-900 shadow-2xs" : "hover:text-neutral-900"
            }`}
          >
            {t("filterAll")} ({debts.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("active")}
            className={`rounded-lg px-3 py-1.5 transition ${
              filter === "active" ? "bg-white text-neutral-900 shadow-2xs" : "hover:text-neutral-900"
            }`}
          >
            {t("filterActive")} ({debts.filter((d) => d.status === "active").length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("paid")}
            className={`rounded-lg px-3 py-1.5 transition ${
              filter === "paid" ? "bg-white text-neutral-900 shadow-2xs" : "hover:text-neutral-900"
            }`}
          >
            {t("filterPaid")} ({debts.filter((d) => d.status === "paid").length})
          </button>
        </div>
      </div>

      {/* Debts Grid / Empty state */}
      {filteredDebts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white py-12 text-center">
          <span className="text-4xl">🤝</span>
          <h3 className="mt-3 text-sm font-bold text-neutral-900">{t("emptyTitle")}</h3>
          <p className="mt-1 text-xs text-neutral-500">
            {filter === "all"
              ? t("emptySubtitleAll")
              : t("emptySubtitleFiltered")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredDebts.map((debt) => {
            const isFullyPaid = debt.status === "paid";

            return (
              <div
                key={debt.id}
                className="flex flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs transition hover:border-neutral-300 hover:shadow-sm"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="truncate text-base font-bold text-neutral-900">
                          {debt.name}
                        </h4>
                        <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-700">
                          {debt.creditor}
                        </span>
                        {debt.category && (
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                            {debt.category}
                          </span>
                        )}
                      </div>
                      {debt.notes && (
                        <p className="mt-1 line-clamp-1 text-xs text-neutral-500">
                          {debt.notes}
                        </p>
                      )}
                    </div>

                    <div>
                      {isFullyPaid ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                          {t("statusPaid")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                          {t("statusActive")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Financial Metrics */}
                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-[#FBF9F4] p-3 text-xs">
                    <div>
                      <span className="text-neutral-500">{t("totalLiabilities")}:</span>
                      <p className="mt-0.5 font-bold text-neutral-900">
                        {formatMoney(debt.totalAmount, formatOptions)}
                      </p>
                    </div>
                    <div>
                      <span className="text-emerald-700">{t("totalPaid")}:</span>
                      <p className="mt-0.5 font-bold text-emerald-800">
                        {formatMoney(debt.paidAmount, formatOptions)}
                      </p>
                    </div>
                    <div>
                      <span className="text-amber-800">{t("remainingLiabilities")}:</span>
                      <p className="mt-0.5 font-bold text-amber-900">
                        {formatMoney(debt.remainingAmount, formatOptions)}
                      </p>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] font-medium text-neutral-500">
                      <span>{t("progressLabel")}</span>
                      <span>{debt.progressPercent}%</span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isFullyPaid ? "bg-emerald-600" : "bg-[#065F46]"
                        }`}
                        style={{ width: `${debt.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Due Date Info */}
                  <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
                    <span>
                      {debt.dueDate ? (
                        t("dueDateLabel", {
                          date: new Date(debt.dueDate).toLocaleDateString(
                            locale === "ar" ? "ar-EG" : "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          ),
                        })
                      ) : (
                        t("noDueDate")
                      )}
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setHistoryTargetDebt(debt)}
                      className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                    >
                      {t("paymentsHistory")}
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setArchiveTargetDebt(debt)}
                      className="rounded-lg px-2 py-1.5 text-xs text-neutral-400 hover:text-red-600"
                    >
                      {t("archive")}
                    </button>
                  </div>

                  {!isFullyPaid && (
                    <button
                      type="button"
                      onClick={() => setPaymentTargetDebt(debt)}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#065F46] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#065F46]/90 active:scale-95"
                    >
                      <span>{t("recordPaymentQuick")}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Record Payment Dialog */}
      {paymentTargetDebt && (
        <RecordDebtPaymentDialog
          isOpen={true}
          onClose={() => setPaymentTargetDebt(null)}
          debt={paymentTargetDebt}
          accounts={accounts}
          workspaceId={workspaceId}
          currency={currency}
        />
      )}

      {/* History Dialog */}
      {historyTargetDebt && (
        <DebtPaymentsDialog
          isOpen={true}
          onClose={() => setHistoryTargetDebt(null)}
          debt={historyTargetDebt}
          workspaceId={workspaceId}
          currency={currency}
        />
      )}

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        open={archiveTargetDebt !== null}
        title={tCommon("confirmation")}
        message={
          archiveTargetDebt
            ? t("archiveConfirmNamed", { name: archiveTargetDebt.name })
            : ""
        }
        confirmLabel={tCommon("archive")}
        pendingLabel={tCommon("archiving")}
        tone="danger"
        isPending={isPending}
        onConfirm={() => {
          if (!archiveTargetDebt) return;
          const target = archiveTargetDebt;
          startTransition(async () => {
            const res = await archiveDebtAction(workspaceId, target.id);
            if (res?.error) {
              toast(res.error, "error");
            } else {
              toast(t("archiveSuccess"), "success");
            }
            setArchiveTargetDebt(null);
          });
        }}
        onCancel={() => setArchiveTargetDebt(null)}
      />

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
