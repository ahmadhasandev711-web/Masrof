"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { CreateClientForm } from "@/features/clients/components/create-client-form";
import { useTranslations } from "next-intl";

export function ClientCreationManager({
  workspaceId,
  canWrite,
}: {
  workspaceId: string;
  canWrite: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();
  const t = useTranslations("pages.clients");
  const tCommon = useTranslations("common");

  useEffect(() => {
    if (searchParams.get("action") === "new") {
      setIsOpen(true);
    }
  }, [searchParams]);

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
        <span>{t("newClientBtn")}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <button
            type="button"
            className="fixed inset-0 bg-black/60 transition-opacity"
            aria-label={tCommon("close")}
            onClick={() => setIsOpen(false)}
          />

          {/* Modal / Bottom Sheet Container */}
          <div className="relative z-10 max-h-[85svh] will-change-transform sm:max-h-[90vh] w-full max-w-xl overflow-y-auto overscroll-contain rounded-t-3xl sm:rounded-3xl border-t sm:border border-[#E4DFD3] bg-[#FBF9F4] p-5 pb-[max(1.75rem,calc(1.25rem+env(safe-area-inset-bottom,0px)))] sm:pb-6 shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 sm:p-6">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-neutral-300 sm:hidden" />
            <div className="mb-4 flex items-center justify-between border-b border-[#E4DFD3] pb-3">
              <div>
                <h2 className="text-base font-bold text-neutral-900 sm:text-lg">
                  {t("newClientTitle")}
                </h2>
                <p className="text-xs text-neutral-500">
                  {t("newClientSubtitle")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700"
                aria-label={tCommon("close")}
              >
                ✕
              </button>
            </div>

            <CreateClientForm
              workspaceId={workspaceId}
              onCancel={() => setIsOpen(false)}
              onSuccess={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
