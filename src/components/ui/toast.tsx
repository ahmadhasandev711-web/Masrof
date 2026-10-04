"use client";

import { useCallback, useRef, useState } from "react";

export type ToastItem = { id: number; message: string; type: "success" | "error" };

export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, type: ToastItem["type"] = "success") => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), 3000);
    },
    [dismiss],
  );

  return { toasts, show, dismiss };
}

export function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-[60] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={
            toast.type === "error"
              ? "flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-red-700 shadow-lg"
              : "flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-emerald-700 shadow-lg"
          }
        >
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="shrink-0 text-neutral-400 transition hover:text-neutral-600"
            aria-label="dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}