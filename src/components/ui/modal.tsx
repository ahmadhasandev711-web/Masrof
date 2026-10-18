"use client";

import { useEffect, type ReactNode } from "react";
import { useTranslations } from "next-intl";

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidthClassName = "max-w-xl",
  ariaLabel,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  maxWidthClassName?: string;
  ariaLabel?: string;
}) {
  const tCommon = useTranslations("common");

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || (typeof title === "string" ? title : undefined)}
    >
      {/* Backdrop */}
      <button
        type="button"
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        aria-label={tCommon("close")}
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={`relative z-10 max-h-[90vh] w-full ${maxWidthClassName} overflow-y-auto rounded-3xl border border-[#E4DFD3] bg-[#FBF9F4] p-5 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200 sm:p-6`}
      >
        <div className="mb-4 flex items-center justify-between border-b border-[#E4DFD3] pb-3">
          <div>
            <h2 className="text-base font-bold text-neutral-900 sm:text-lg">{title}</h2>
            {subtitle && <p className="text-xs text-neutral-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700"
            aria-label={tCommon("close")}
          >
            ✕
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
