"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { CreateAccountForm } from "@/features/accounts/components/create-account-form";
import type { SupportedCurrency } from "@/models/workspace";
import { useTranslations } from "next-intl";

export function AccountCreationManager({
  workspaceId,
  workspaceCurrency,
  canUseMultiCurrency,
  canWrite = true,
}: {
  workspaceId: string;
  workspaceCurrency: SupportedCurrency;
  canUseMultiCurrency: boolean;
  canWrite?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();
  const t = useTranslations("pages.accounts");
  const tForm = useTranslations("forms.account");

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setIsOpen(true);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [searchParams]);

  if (!canWrite) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-[#065F46] px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#054E3A] active:scale-98"
      >
        <span className="text-base font-bold leading-none">+</span>
        <span>{t("newAccountBtn")}</span>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={tForm("title")}
        maxWidthClassName="max-w-lg"
      >
        <CreateAccountForm
          workspaceId={workspaceId}
          workspaceCurrency={workspaceCurrency}
          canUseMultiCurrency={canUseMultiCurrency}
          hideHeader={true}
          onSuccess={() => setIsOpen(false)}
          onCancel={() => setIsOpen(false)}
        />
      </Modal>
    </>
  );
}
