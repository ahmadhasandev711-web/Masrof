"use client";

import { useState, useEffect } from "react";
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
  const t = useTranslations("pages.accounts");

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

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

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <button
            type="button"
            className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
            aria-label="Close"
          />

          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <CreateAccountForm
              workspaceId={workspaceId}
              workspaceCurrency={workspaceCurrency}
              canUseMultiCurrency={canUseMultiCurrency}
              onSuccess={() => setIsOpen(false)}
              onCancel={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
