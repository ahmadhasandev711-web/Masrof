"use client";

import { useState, useTransition, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { formatMoney } from "@/lib/money";
import type { InvoiceListItem } from "@/features/invoices/types";
import {
  getOrCreateShareTokenAction,
  regenerateShareTokenAction,
  toggleShareableAction,
} from "@/features/invoices/actions/share-invoice";
import { invoiceShareWhatsAppMessage } from "@/features/whatsapp/messages";
import { normalizeWhatsAppPhone } from "@/lib/whatsapp";
import { useTranslations } from "next-intl";

function formatDueDate(isoDate: string | null) {
  if (!isoDate) return null;
  return new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(isoDate));
}

export function InvoiceShareDialog({
  invoice,
  workspaceId,
  workspaceName,
  currency,
  canUseWhatsApp,
  onClose,
}: {
  invoice: InvoiceListItem;
  workspaceId: string;
  workspaceName: string;
  currency: string;
  canUseWhatsApp: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("forms.invoice");
  const tCommon = useTranslations("common");
  const tWhatsappMessages = useTranslations("whatsapp");

  const [token, setToken] = useState<string | null>(invoice.shareToken ?? null);
  const [isShareable, setIsShareable] = useState<boolean>(invoice.isShareable ?? true);
  const [copied, setCopied] = useState(false);
  const [loadingToken, setLoadingToken] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Lazily ensure token exists if invoice didn't have one
  useEffect(() => {
    if (!token) {
      setLoadingToken(true);
      getOrCreateShareTokenAction(invoice._id, workspaceId).then((res) => {
        setLoadingToken(false);
        if (res.success && res.token) {
          setToken(res.token);
        } else if (res.error) {
          setActionError(res.error);
        }
      });
    }
  }, [token, invoice._id, workspaceId]);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = token ? `${origin}/i/${token}` : "";

  async function handleCopy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error("Failed to copy:", e);
    }
  }

  function handleRegenerate() {
    if (!confirm(t("regenerateLinkConfirm"))) return;
    startTransition(async () => {
      setActionError(null);
      const res = await regenerateShareTokenAction(invoice._id, workspaceId);
      if (res.success && res.token) {
        setToken(res.token);
      } else if (res.error) {
        setActionError(res.error);
      }
    });
  }

  function handleToggleShareable() {
    startTransition(async () => {
      setActionError(null);
      const nextState = !isShareable;
      const res = await toggleShareableAction(invoice._id, workspaceId, nextState);
      if (res.success) {
        setIsShareable(nextState);
      } else if (res.error) {
        setActionError(res.error);
      }
    });
  }

  // Build WhatsApp share URL
  const whatsappText = invoiceShareWhatsAppMessage(tWhatsappMessages as any, {
    clientName: invoice.clientName,
    invoiceNumber: invoice.invoiceNumber,
    remainingLabel: formatMoney(invoice.remainingAmount, { currency }),
    dueDateLabel: formatDueDate(invoice.dueDate),
    workspaceName,
    shareUrl,
  });

  const normalizedPhone = invoice.clientPhone ? normalizeWhatsAppPhone(invoice.clientPhone) : null;
  const whatsappHref = normalizedPhone
    ? `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(whatsappText)}`
    : `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t("shareDialogTitle")}
      subtitle={t("shareDialogSubtitle")}
      maxWidthClassName="max-w-md"
    >
      <div className="flex flex-col gap-4">
        {/* Invoice Summary Pill */}
        <div className="rounded-xl border border-neutral-100 dark:border-[#26302C] bg-neutral-50 dark:bg-[#1E2824] p-3 text-xs flex justify-between items-center">
          <div>
            <span className="font-semibold text-neutral-800 dark:text-[#ECEAE4]">{invoice.invoiceNumber}</span>
            <span className="text-neutral-500 dark:text-[#9AA39F] ms-2">({invoice.clientName})</span>
          </div>
          <span className="font-bold text-neutral-900 dark:text-[#ECEAE4]">
            {formatMoney(invoice.remainingAmount, { currency })}
          </span>
        </div>

        {/* Viewed Status */}
        <div className="text-xs">
          {invoice.viewedAt ? (
            <p className="flex items-center gap-1.5 text-emerald-700 dark:text-[#34D399] font-medium">
              <span>👁️</span>
              <span>{t("viewedAt", { date: formatDueDate(invoice.viewedAt) ?? "" })}</span>
            </p>
          ) : (
            <p className="text-neutral-400 dark:text-[#9AA39F]">{t("notViewedYet")}</p>
          )}
        </div>

        {actionError && (
          <div className="rounded-lg bg-rose-50 dark:bg-rose-950/30 p-2.5 text-xs text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
            {actionError}
          </div>
        )}

        {/* Link Field */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-neutral-700 dark:text-[#ECEAE4]">{t("directInvoiceLink")}</label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={loadingToken ? t("generating") : shareUrl}
              dir="ltr"
              className="flex-1 rounded-lg border border-neutral-300 dark:border-[#26302C] bg-neutral-50 dark:bg-[#1E2824] px-3 py-2 text-xs text-neutral-700 dark:text-[#ECEAE4] focus:outline-none"
            />
            <button
              type="button"
              disabled={loadingToken || !shareUrl}
              onClick={handleCopy}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                copied
                  ? "bg-emerald-600 dark:bg-[#10B981] text-white dark:text-[#04231A]"
                  : "bg-neutral-900 dark:bg-[#ECEAE4] text-white dark:text-[#0E1412] hover:bg-neutral-800 dark:hover:bg-white disabled:opacity-50"
              }`}
            >
              {copied ? t("linkCopied") : t("copyLink")}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2 border-t border-neutral-100 dark:border-[#26302C]">
          {/* WhatsApp Button */}
          {canUseWhatsApp && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <span>💬</span>
              <span>{t("shareViaWhatsApp")}</span>
            </a>
          )}

          {/* Toggle Share / Regenerate Controls */}
          <div className="flex justify-between items-center text-xs pt-1">
            <button
              type="button"
              disabled={isPending}
              onClick={handleToggleShareable}
              className={`font-medium ${
                isShareable ? "text-amber-700 dark:text-amber-400 hover:underline" : "text-emerald-700 dark:text-[#34D399] hover:underline"
              }`}
            >
              {isShareable ? t("disableShare") : t("toggleShare")}
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={handleRegenerate}
              className="text-neutral-400 dark:text-[#9AA39F] hover:text-neutral-700 dark:hover:text-[#ECEAE4] hover:underline"
            >
              {isPending ? t("regenerating") : t("regenerateLink")}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-300 dark:border-[#26302C] px-4 py-2 text-xs font-medium text-neutral-700 dark:text-[#ECEAE4] hover:bg-neutral-50 dark:hover:bg-[#1E2824]"
          >
            {tCommon("close")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
