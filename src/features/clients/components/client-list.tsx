"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { archiveClientAction } from "@/features/clients/actions/archive-client";
import { EditClientForm } from "@/features/clients/components/edit-client-form";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ToastStack, useToasts } from "@/components/ui/toast";
import type { ClientListItem } from "@/features/clients/types";
import { useLocale, useTranslations } from "next-intl";
import { NavIcon } from "@/components/ui/app-icons";

export function ClientList({
  clients,
  workspaceId,
  currency = "EGP",
}: {
  clients: ClientListItem[];
  workspaceId: string;
  currency?: string;
}) {
  const locale = useLocale();
  const tCommon = useTranslations("common");
  const tConfirm = useTranslations("confirm");
  const tEmpty = useTranslations("empty");
  const tNav = useTranslations("nav");
  const tClients = useTranslations("pages.clients");

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
    const clean = getCleanPhone(rawPhone);
    if (!clean) return null;
    // Normalize Egyptian standard local number: 01xxxxxxxxx -> +201xxxxxxxxx
    let normalized = clean.replace(/^[+]/, "");
    if (normalized.startsWith("01") && normalized.length === 11) {
      normalized = "2" + normalized;
    }
    return `https://wa.me/${normalized}`;
  }

  if (clients.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center text-neutral-400">
        <span className="mb-2 flex justify-center text-neutral-400">
          <NavIcon name="clients" className="h-10 w-10" />
        </span>
        <p className="font-semibold text-neutral-700">{tEmpty("noClients")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      <ul className="flex flex-col gap-3.5">
        {clients.map((client) => {
          const id = client._id;
          const editing = editingId === id;
          const cleanPhone = getCleanPhone(client.phone);
          const whatsappUrl = getWhatsAppUrl(client.phone);

          return (
            <li
              key={id}
              className="group relative overflow-hidden rounded-2xl border border-neutral-200/90 bg-white p-4 sm:p-5 shadow-xs transition hover:border-[#065F46]/40 hover:shadow-sm"
            >
              {editing ? (
                <EditClientForm
                  client={client}
                  workspaceId={workspaceId}
                  onCancel={() => setEditingId(null)}
                  onSuccess={() => {
                    setEditingId(null);
                    show(tCommon("savedClient"));
                  }}
                />
              ) : (
                <div className="flex flex-col gap-3">
                  {/* Top Row: Name, Badges & Quick Contact Buttons */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <p className="truncate text-base sm:text-lg font-bold text-neutral-900">
                        {client.name}
                      </p>

                      {/* Outstanding Debt / Settled Badge */}
                      {client.outstandingBalance > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-rose-200/90 bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 font-mono tabular-nums">
                          <NavIcon name="debts" className="h-3.5 w-3.5" />
                          <span>{tClients("debtDue")}:</span>
                          <span>{formatMoney(client.outstandingBalance, { currency, locale })}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/90 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                          <NavIcon name="check" className="h-3.5 w-3.5" />
                          <span>{tClients("settledAccount")}</span>
                        </span>
                      )}

                      {/* Linked Projects Pill */}
                      {client.projectCount > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-700">
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
                            className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 active:scale-95"
                          >
                            <NavIcon name="chat" className="h-3.5 w-3.5" />
                            <span>{tClients("whatsappChat")}</span>
                          </a>
                        )}
                        <a
                          href={`tel:${cleanPhone}`}
                          className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-200 active:scale-95"
                        >
                          <NavIcon name="phone" className="h-3.5 w-3.5" />
                          <span>{tClients("callPhone")}</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Contact Info (Email / Phone) */}
                  {(client.email || client.phone) && (
                    <p className="text-xs text-neutral-500">
                      {[client.email, client.phone].filter(Boolean).join(" · ")}
                    </p>
                  )}

                  {/* Financial Metrics Strip */}
                  {(client.invoicedTotal > 0 || client.paidTotal > 0 || client.outstandingBalance > 0) && (
                    <div className="grid grid-cols-3 gap-2 rounded-xl border border-neutral-100 bg-[#FBF9F4] p-3 text-center sm:text-start">
                      <div>
                        <span className="block text-[11px] font-medium text-neutral-400">
                          {tClients("invoicedAmount")}
                        </span>
                        <span className="mt-0.5 block font-mono text-xs sm:text-sm font-bold text-neutral-900 tabular-nums">
                          {formatMoney(client.invoicedTotal, { currency, locale })}
                        </span>
                      </div>

                      <div>
                        <span className="block text-[11px] font-medium text-emerald-800/80">
                          {tClients("paidAmount")}
                        </span>
                        <span className="mt-0.5 block font-mono text-xs sm:text-sm font-bold text-emerald-700 tabular-nums">
                          {formatMoney(client.paidTotal, { currency, locale })}
                        </span>
                      </div>

                      <div>
                        <span className="block text-[11px] font-medium text-rose-800/80">
                          {tClients("debtDue")}
                        </span>
                        <span
                          className={`mt-0.5 block font-mono text-xs sm:text-sm font-bold tabular-nums ${
                            client.outstandingBalance > 0 ? "text-rose-700" : "text-emerald-700"
                          }`}
                        >
                          {formatMoney(client.outstandingBalance, { currency, locale })}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Links & Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-100 text-xs">
                    <div className="flex items-center gap-3">
                      <a
                        href={`/print/statement/${id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                      >
                        <NavIcon name="invoices" className="h-3.5 w-3.5" />
                        <span>{tClients("statement")}</span>
                      </a>
                      <span className="text-neutral-300">·</span>
                      <Link
                        href={`/dashboard/invoices?clientId=${id}`}
                        className="font-medium text-neutral-600 hover:text-neutral-900 hover:underline"
                      >
                        {tClients("viewInvoices")}
                      </Link>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingId(id)}
                        className="font-medium text-neutral-500 transition hover:text-emerald-700"
                      >
                        {tCommon("edit")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setArchiveTarget(client)}
                        disabled={isPending}
                        className="font-medium text-neutral-400 transition hover:text-rose-600 disabled:opacity-60"
                      >
                        {tCommon("archive")}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

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