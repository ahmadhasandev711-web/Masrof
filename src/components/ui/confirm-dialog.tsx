"use client";

import { useTranslations } from "next-intl";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  isPending,
  onConfirm,
  onCancel,
  tone = "danger",
}: {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  tone?: "danger" | "primary";
}) {
  const tCommon = useTranslations("common");
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
        {message && <p className="mt-2 text-sm leading-relaxed text-neutral-600">{message}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-60"
          >
            {tCommon("cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={
              tone === "danger"
                ? "rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-60"
                : "rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:opacity-60"
            }
          >
            {isPending ? tCommon("archiving") : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}