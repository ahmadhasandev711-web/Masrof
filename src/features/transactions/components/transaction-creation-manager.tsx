"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Modal } from "@/components/ui/modal";
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
  const searchParams = useSearchParams();
  const [modalType, setModalType] = useState<"transaction" | "transfer" | null>(null);
  const [initialTxType, setInitialTxType] = useState<"expense" | "income">("expense");

  useEffect(() => {
    const action = searchParams.get("action");
    const tab = searchParams.get("tab");
    if (action === "transfer" || tab === "transfers") {
      setModalType("transfer");
      window.history.replaceState(null, "", window.location.pathname);
    } else if (action === "new-income") {
      setInitialTxType("income");
      setModalType("transaction");
      window.history.replaceState(null, "", window.location.pathname);
    } else if (action === "new-expense" || action === "new") {
      setInitialTxType("expense");
      setModalType("transaction");
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [searchParams]);

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

      <Modal
        isOpen={modalType !== null}
        onClose={() => setModalType(null)}
        title={modalType === "transaction" ? t("modalTransactionTitle") : t("modalTransferTitle")}
        maxWidthClassName="max-w-2xl"
        headerExtra={
          <div className="flex items-center rounded-xl bg-neutral-200/70 p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setModalType("transaction")}
              className={`rounded-lg px-2.5 py-1 transition ${
                modalType === "transaction"
                  ? "bg-white text-neutral-900 shadow-2xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              {t("modalTransactionTitle")}
            </button>
            <button
              type="button"
              onClick={() => setModalType("transfer")}
              className={`rounded-lg px-2.5 py-1 transition ${
                modalType === "transfer"
                  ? "bg-white text-neutral-900 shadow-2xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              {t("modalTransferTitle")}
            </button>
          </div>
        }
      >
        {modalType === "transaction" ? (
          <CreateTransactionForm
            workspaceId={workspaceId}
            accounts={accounts}
            categories={categories}
            clients={clients}
            projects={projects}
            defaultProjectId={defaultProjectId}
            initialType={initialTxType}
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
      </Modal>
    </>
  );
}
