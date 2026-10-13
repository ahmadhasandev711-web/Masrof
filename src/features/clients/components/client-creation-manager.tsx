"use client";

import { useState, useEffect } from "react";
import { CreateClientForm } from "@/features/clients/components/create-client-form";

export function ClientCreationManager({
  workspaceId,
  canWrite,
}: {
  workspaceId: string;
  canWrite: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

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
        <span>إضافة عميل جديد</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <button
            type="button"
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            aria-label="إغلاق"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Container */}
          <div className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-[#E4DFD3] bg-[#FBF9F4] p-5 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200 sm:p-6">
            <div className="mb-4 flex items-center justify-between border-b border-[#E4DFD3] pb-3">
              <div>
                <h2 className="text-base font-bold text-neutral-900 sm:text-lg">
                  إضافة عميل جديد
                </h2>
                <p className="text-xs text-neutral-500">
                  سجل بيانات العميل لإصدار الفواتير وربط المشاريع
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700"
                aria-label="إغلاق"
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
