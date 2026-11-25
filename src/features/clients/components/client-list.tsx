"use client";

import { normalizeWhatsAppPhone } from "@/lib/whatsapp";
import { useState, useTransition } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { archiveClientAction } from "@/features/clients/actions/archive-client";
import { EditClientForm } from "@/features/clients/components/edit-client-form";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ToastStack, useToasts } from "@/components/ui/toast";
import type { ClientListItem } from "@/features/clients/types";
import { useLocale, useTranslations } from "next-intl";
import { NavIcon } from "@/components/ui/app-icons";
import { MOBILE_ACTION_BTN } from "@/components/ui/mobile-field";

export function ClientList({
  clients,
  workspaceId,
  currency,
  canWrite = true,
}: {
  clients: ClientListItem[];
  workspaceId: string;
  currency: string;
  canWrite?: boolean;
}) {
  const locale = useLocale();
  const tCommon = useTranslations("common");
  const tConfirm = useTranslations("confirm");
  const tEmpty = useTranslations("empty");
  const tNav = useTranslations("nav");
  const tClients = useTranslations("pages.clients");
  const tClientForm = useTranslations("forms.client");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<ClientListItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toasts, show, dismiss } = useToasts();

  function handleArchive() {
    if (!archiveTarget) return;
    startTransition(async () => {
      const result = await archiveClientAction(archiveTarget._id, workspaceId);
      setArchiveTarget(null);
      if (result.error) {
        show(result.error, "error");
      } else {
        show(tCommon("archivedClient"));
      }
    });
  }

  function getCleanPhone(rawPhone: string | null) {
    if (!rawPhone) return null;
    return rawPhone.replace(/[^0-9+]/g, "");
  }

  function getWhatsAppUrl(rawPhone: string | null) {
    // One normalization rule for the whole product (contracts/shared/whatsapp).
    const normalized = rawPhone ? normalizeWhatsAppPhone(rawPhone) : null;
    return normalized ? `https://wa.me/${normalized}` : null;
  }

  if (clients.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 dark:border-[#26302C] bg-white dark:bg-[#161E1B] p-12 text-center text-neutral-400 dark:text-[#9AA39F]">
        <span className="mb-2 flex justify-center text-neutral-400 dark:text-[#66706B]">
          <NavIcon name="clients" className="h-10 w-10" />
        </span>
        <p className="font-semibold text-neutral-700 dark:text-[#ECEAE4]">{tEmpty("noClients")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      <ul className="flex flex-col gap-3.5">
        {clients.map((client) => {
          const id = client._id;
          const cleanPhone = getCleanPhone(client.phone);
          const whatsappUrl = getWhatsAppUrl(client.phone);

          return (
            <li
              key={id}
              className="group relative overflow-hidden rounded-2xl border border-neutral-200/90 dark:border-[#26302C] bg-white dark:bg-[#161E1B] p-4 sm:p-5 shadow-xs transition hover:border-[#065F46]/40 dark:hover:border-[#34D399]/40 hover:shadow-sm"
            >
              <div className="flex flex-col gap-3">
                  {/* Top Row: Name, Badges & Quick Contact Buttons */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <p className="truncate text-base sm:text-lg font-bold text-neutral-900 dark:text-[#ECEAE4]">
                        {client.name}
                      </p>

                      {/* Outstanding Debt / Settled Badge */}
                      {client.outstandingBalance > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-rose-200/90 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/15 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:text-rose-400 font-mono tabular-nums">
                          <NavIcon name="debts" className="h-3.5 w-3.5" />
                          <span>{tClients("debtDue")}:</span>
                          <span>{formatMoney(client.outstandingBalance, { currency, locale })}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/90 dark:border-[#34D399]/30 bg-emerald-50 dark:bg-[#0F2E24] px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-[#34D399]">
                          <NavIcon name="check" className="h-3.5 w-3.5" />
                          <span>{tClients("settledAccount")}</span>
                        </span>
                      )}

                      {/* Linked Projects Pill */}
                      {client.projectCount > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 dark:bg-[#1E2824] px-2.5 py-0.5 text-xs font-semibold text-neutral-700 dark:text-[#ECEAE4]">
                          <NavIcon name="projects" className="h-3.5 w-3.5" />
                          <span>
                            {client.projectCount} {tNav("projects")}
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Quick WhatsApp & Call Buttons (One-tap contact) */}
                    {cleanPhone && (
                      <div className="flex items-center gap-2 shrink-0">
                        {whatsappUrl && (
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 dark:border-[#34D399]/30 bg-emerald-50 dark:bg-[#0F2E24] px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-[#34D399] transition hover:bg-emerald-100 dark:hover:bg-[#0F2E24]/80 active:scale-95"
                          >
                            <NavIcon name="chat" className="h-3.5 w-3.5" />
                            <span>{tClients("whatsappChat")}</span>
                          </a>
                        )}
                        <a
                          href={`tel:${cleanPhone}`}
                          className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 dark:border-[#26302C] bg-neutral-100 dark:bg-[#1E2824] px-2.5 py-1 text-xs font-semibold text-neutral-700 dark:text-[#ECEAE4] transition hover:bg-neutral-200 dark:hover:bg-[#26302C] active:scale-95"
                        >
                          <NavIcon name="phone" className="h-3.5 w-3.5" />
                          <span>{tClients("callPhone")}</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Contact Info (Email / Phone) */}
                  {(client.email || client.phone) && (
                    <p className="text-xs text-neutral-500 dark:text-[#9AA39F]">
                      {[client.email, client.phone].filter(Boolean).join(" · ")}
                    </p>
                  )}

                  {/* Financial Metrics Strip */}
                  {(client.invoicedTotal > 0 || client.paidTotal > 0 || client.outstandingBalance > 0) && (
                    <div className="grid grid-cols-3 gap-2 rounded-xl border border-neutral-100 dark:border-[#26302C] bg-[#FBF9F4] dark:bg-[#1E2824] p-3 text-center sm:text-start">
                      <div>
                        <span className="block text-[11px] font-medium text-neutral-400 dark:text-[#9AA39F]">
                          {tClients("invoicedAmount")}
                        </span>
                        <span className="mt-0.5 block font-mono text-xs sm:text-sm font-bold text-neutral-900 dark:text-[#ECEAE4] tabular-nums">
                          {formatMoney(client.invoicedTotal, { currency, locale })}
                        </span>
                      </div>

                      <div>
                        <span className="block text-[11px] font-medium text-emerald-800/80 dark:text-[#34D399]">
                          {tClients("paidAmount")}
                        </span>
                        <span className="mt-0.5 block font-mono text-xs sm:text-sm font-bold text-emerald-700 dark:text-[#34D399] tabular-nums">
                          {formatMoney(client.paidTotal, { currency, locale })}
                        </span>
                      </div>

                      <div>
                        <span className="block text-[11px] font-medium text-rose-800/80 dark:text-rose-400">
                          {tClients("debtDue")}
                        </span>
                        <span
                          className={`mt-0.5 block font-mono text-xs sm:text-sm font-bold tabular-nums ${
                            client.outstandingBalance > 0 ? "text-rose-700 dark:text-rose-400" : "text-emerald-700 dark:text-[#34D399]"
                          }`}
                        >
                          {formatMoney(client.outstandingBalance, { currency, locale })}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Links & Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-100 dark:border-[#26302C] text-xs">
                    <div className="flex items-center gap-3">
                      <a
                        href={`/print/statement/${id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-[#34D399] hover:text-emerald-800 dark:hover:text-[#34D399]/80 hover:underline"
                      >
                        <NavIcon name="invoices" className="h-3.5 w-3.5" />
                        <span>{tClients("statement")}</span>
                      </a>
                      <span className="text-neutral-300 dark:text-[#66706B]">·</span>
                      <Link
                        href={`/dashboard/invoices?clientId=${id}`}
                        className="font-medium text-neutral-600 dark:text-[#9AA39F] hover:text-neutral-900 dark:hover:text-[#ECEAE4] hover:underline"
                      >
                        {tClients("viewInvoices")}
                      </Link>
                    </div>

                    {canWrite && (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(id)}
                          className={`${MOBILE_ACTION_BTN} border-neutral-200 dark:border-[#26302C] bg-white dark:bg-[#1E2824] text-neutral-700 dark:text-[#ECEAE4] hover:bg-neutral-50 dark:hover:bg-[#26302C]`}
                        >
                          <NavIcon name="edit" className="h-4 w-4 shrink-0" />
                          <span>{tCommon("edit")}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setArchiveTarget(client)}
                          disabled={isPending}
                          className={`${MOBILE_ACTION_BTN} border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/15 text-rose-800 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/25 disabled:opacity-60`}
                        >
                          <NavIcon name="trash" className="h-4 w-4 shrink-0" />
                          <span>{tCommon("archive")}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
            </li>
          );
        })}
      </ul>

      {/* Full-Screen SaaS Edit Client Modal */}
      {(() => {
        const clientBeingEdited = clients.find((c) => c._id === editingId);
        return (
          <Modal
            isOpen={clientBeingEdited !== undefined}
            onClose={() => setEditingId(null)}
            title={tClientForm("editTitle")}
            maxWidthClassName="max-w-xl"
          >
            {clientBeingEdited && (
              <EditClientForm
                client={clientBeingEdited}
                workspaceId={workspaceId}
                onCancel={() => setEditingId(null)}
                onSuccess={() => {
                  setEditingId(null);
                  show(tCommon("savedClient"));
                }}
              />
            )}
          </Modal>
        );
      })()}

      <ConfirmDialog
        open={archiveTarget !== null}
        title={tCommon("confirmation")}
        message={archiveTarget ? tConfirm("archiveClientNamed", { name: archiveTarget.name }) : ""}
        confirmLabel={tCommon("archive")}
        isPending={isPending}
        onConfirm={handleArchive}
        onCancel={() => setArchiveTarget(null)}
      />

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}