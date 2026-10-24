"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

/**
 * PWA install — not admin-specific. Chrome fires `beforeinstallprompt` only
 * when install criteria are met (HTTPS, manifest, SW in production, engagement).
 * We always show the button with manual steps when the native prompt is absent.
 */
export function InstallPwaButton({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("pwa");
  const installed = useSyncExternalStore(
    () => () => {},
    () => isStandalone(),
    () => false,
  );
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (installed) return;

    function handleBeforeInstall(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, [installed]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  if (installed) {
    return null;
  }

  async function handleNativeInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setOpen(false);
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => (deferredPrompt ? handleNativeInstall() : setOpen((v) => !v))}
        className="rounded-lg border border-[#065F46]/20 bg-[#ECFDF5] px-2 py-1.5 text-sm font-medium text-[#065F46] transition hover:bg-[#D1FAE5] sm:px-3"
      >
        {compact ? "" : t("install")}
      </button>

      {open && !deferredPrompt && (
        <div className="absolute start-0 top-full z-50 mt-2 w-72 rounded-xl border border-[#E4DFD3] bg-white p-4 text-sm shadow-lg">
          <p className="font-medium text-[#1C1B1A]">{t("title")}</p>
          {isIos() ? (
            <ol className="mt-2 list-decimal space-y-1 ps-4 text-[#1C1B1A]/70">
              <li>{t("ios1")}</li>
              <li>{t("ios2")}</li>
              <li>{t("ios3")}</li>
            </ol>
          ) : (
            <ol className="mt-2 list-decimal space-y-1 ps-4 text-[#1C1B1A]/70">
              <li>{t("android1")}</li>
              <li>{t("android2")}</li>
              <li>{t("android3")}</li>
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
