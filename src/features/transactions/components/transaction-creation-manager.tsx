"use client";

import { useState, useEffect } from "react";
import { CreateTransactionForm } from "@/features/transactions/components/create-transaction-form";
import { CreateTransferForm } from "@/features/transfers/components/create-transfer-form";
import { useTranslations } from "next-intl";
import type { CategoryOption } from "@/features/categories/map-options";

type AccountOption = { id: string; name: string; currency: string };
type LinkOption = { id: string; name: string; phone?: string | null };

export function TransactionCreationManager({
  workspaceId,
  accounts,
  categories,
  clients,
  projects,
  defaultProjectId,
  ocrReceipts,
  aiCategory,
  canWrite,
}: {
  workspaceId: string;
  accounts: AccountOption[];
  categories: CategoryOption[];
  clients: LinkOption[];
  projects: LinkOption[];
  defaultProjectId?: string;
  ocrReceipts?: boolean;
  aiCategory?: boolean;
  canWrite: boolean;
}) {
  const t = useTranslations("pages.transactions");
  const tCommon = useTranslations("common");
  const [modalType, setModalType] = useState<"transaction" | "transfer" | null>(null);

  useEffect(() => {
    if (!modalType) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setModalType(null);
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [modalType]);

  if (!canWrite) return null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setModalType("transaction")}
          className="flex items-center gap-2 rounded-xl bg-[#065F46] px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#054E3A] active:scale-98"
        >
          <span className="text-base font-bold leading-none">+</span>
          <span>{t("newTransactionBtn")}</span>
        </button>

        <button
          type="button"
          onClick={() => setModalType("transfer")}
          className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/60 px-4 py-2.5 text-sm font-semibold text-blue-900 shadow-2xs transition hover:bg-blue-100/70 active:scale-98"
        >
          <span className="text-sm">⇄</span>
          <span>{t("transferBtn")}</span>
        </button>
      </div>

      {/* Modal Dialog */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <button
            type="button"
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            aria-label={tCommon("close")}
            onClick={() => setModalType(null)}
          />

          {/* Modal / Bottom Sheet Container */}
          <div className="relative z-10 max-h-[88vh] sm:max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl sm:rounded-3xl border-t sm:border border-[#E4DFD3] bg-[#FBF9F4] p-5 pb-[max(1.75rem,calc(1.25rem+env(safe-area-inset-bottom,0px)))] sm:pb-6 shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 sm:p-6">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-neutral-300 sm:hidden" />
            <div className="mb-4 flex items-center justify-between border-b border-[#E4DFD3] pb-3">
              <h2 className="text-base font-bold text-neutral-900 sm:text-lg">
                {modalType === "transaction" ? t("modalTransactionTitle") : t("modalTransferTitle")}
              </h2>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700"
                aria-label={tCommon("close")}
              >
                ✕
              </button>
            </div>

            {modalType === "transaction" ? (
              <CreateTransactionForm
                workspaceId={workspaceId}
                accounts={accounts}
                categories={categories}
                clients={clients}
                projects={projects}
                defaultProjectId={defaultProjectId}
                ocrReceipts={ocrReceipts}
                aiCategory={aiCategory}
                onSuccess={() => setModalType(null)}
                onCancel={() => setModalType(null)}
              />
            ) : (
              <CreateTransferForm
                workspaceId={workspaceId}
                accounts={accounts}
                onSuccess={() => setModalType(null)}
                onCancel={() => setModalType(null)}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
