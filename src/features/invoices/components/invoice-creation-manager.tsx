"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { CreateInvoiceForm } from "@/features/invoices/components/create-invoice-form";
import type { ComboboxClientItem } from "@/features/clients/components/client-combobox";
import { useTranslations } from "next-intl";

type ProjectOption = { _id: string; name: string; clientId: string };

export function InvoiceCreationManager({
  workspaceId,
  clients,
  projects = [],
  defaultClientId,
  defaultProjectId,
  canWrite,
}: {
  workspaceId: string;
  clients: ComboboxClientItem[];
  projects?: ProjectOption[];
  defaultClientId?: string;
  defaultProjectId?: string;
  canWrite: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();
  const t = useTranslations("pages.invoices");

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setIsOpen(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [searchParams]);

  if (!canWrite) return null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-[#065F46] px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#054E3A] active:scale-98"
        >
          <span className="text-base font-bold leading-none">+</span>
          <span>{t("newInvoiceBtn")}</span>
        </button>
      </div>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={t("newInvoiceTitle")}
        subtitle={t("newInvoiceSubtitle")}
        maxWidthClassName="max-w-3xl"
      >
        <CreateInvoiceForm
          workspaceId={workspaceId}
          clients={clients}
          projects={projects}
          defaultClientId={defaultClientId}
          defaultProjectId={defaultProjectId}
          onCancel={() => setIsOpen(false)}
        />
      </Modal>
    </>
  );
}
