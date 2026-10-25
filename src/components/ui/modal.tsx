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
  headerExtra,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  maxWidthClassName?: string;
  ariaLabel?: string;
  headerExtra?: ReactNode;
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
      className="fixed inset-0 z-50 flex flex-col bg-[#FBF9F4] sm:bg-transparent sm:items-center sm:justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel || (typeof title === "string" ? title : undefined)}
    >
      {/* Desktop Backdrop (hidden on mobile for zero GPU blending) */}
      <button
        type="button"
        className="hidden sm:block fixed inset-0 bg-black/60 transition-opacity"
        aria-label={tCommon("close")}
        onClick={onClose}
      />

      {/* Modal Container: Full Screen on Mobile, Rounded Card on Desktop */}
      <div
        className={`relative z-10 flex h-full w-full flex-col bg-[#FBF9F4] sm:h-auto sm:max-h-[90vh] ${maxWidthClassName} sm:rounded-3xl sm:border sm:border-[#E4DFD3] sm:shadow-2xl animate-in fade-in-0 duration-150`}
        style={{ contain: "layout paint" }}
      >
        {/* Sticky Header */}
        <div className="shrink-0 flex items-center justify-between gap-3 border-b border-[#E4DFD3] bg-[#FBF9F4] px-4 pb-3.5 pt-[max(0.875rem,calc(0.5rem+env(safe-area-inset-top,0px)))] sm:rounded-t-3xl sm:px-6 sm:pt-5">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-bold text-neutral-900 sm:text-lg">{title}</h2>
            {subtitle && <p className="truncate text-xs text-neutral-500">{subtitle}</p>}
          </div>

          {headerExtra && <div className="shrink-0">{headerExtra}</div>}

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-neutral-500 hover:bg-neutral-200/70 hover:text-neutral-900 active:scale-95 transition-transform"
            aria-label={tCommon("close")}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Body: with safe keyboard bottom padding */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-[calc(var(--kb-height,0px)+max(2rem,env(safe-area-inset-bottom,0px)))] sm:px-6 sm:py-5 sm:pb-6">
          {children}
        </div>
      </div>
    </div>
  );
}
