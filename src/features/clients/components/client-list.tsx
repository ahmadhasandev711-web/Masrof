"use client";

import { useMemo, useState, useTransition } from "react";
import { archiveClientAction } from "@/features/clients/actions/archive-client";
import { EditClientForm } from "@/features/clients/components/edit-client-form";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ToastStack, useToasts } from "@/components/ui/toast";
import type { ClientListItem } from "@/features/clients/types";
import { useTranslations } from "next-intl";

export function ClientList({
  clients,
  workspaceId,
}: {
  clients: ClientListItem[];
  workspaceId: string;
}) {
  const tCommon = useTranslations("common");
  const tConfirm = useTranslations("confirm");
  const tEmpty = useTranslations("empty");
  const tNav = useTranslations("nav");
  const tForm = useTranslations("forms.client");

  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<ClientListItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toasts, show, dismiss } = useToasts();

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(q) ||
        (client.phone ?? "").toLowerCase().includes(q),
    );
  }, [clients, query]);

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

  return (
    <div className="flex flex-col gap-4">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={tForm("searchPlaceholder")}
        className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-right focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
      />

      {clients.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-400">
          {tEmpty("noClients")}
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-400">
          {tEmpty("noMatchingClients")}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {filteredClients.map((client) => {
            const id = client._id;
            const editing = editingId === id;
            return (
              <li
                key={id}
                className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-5 py-4 shadow-sm"
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
                  <>
                    <div>
                      <p className="font-medium text-neutral-900">{client.name}</p>
                      <p className="text-sm text-neutral-500">
                        {[client.email, client.phone].filter(Boolean).join(" · ") || "—"}
                      </p>
                      {client.projectCount > 0 && (
                        <p className="mt-1 text-xs text-neutral-400">
                          {client.projectCount} {tNav("projects")}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/print/statement/${id}`}
                          target="_blank"
                          className="text-sm font-medium text-emerald-700 hover:underline"
                        >
                          كشف حساب
                        </a>
                        <span className="text-neutral-300">·</span>
                        <a
                          href={`/dashboard/invoices?clientId=${id}`}
                          className="text-sm text-neutral-600 hover:underline"
                        >
                          {tNav("invoices")}
                        </a>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setEditingId(id)}
                          className="text-sm text-neutral-400 transition hover:text-emerald-700"
                        >
                          {tCommon("edit")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setArchiveTarget(client)}
                          disabled={isPending}
                          className="text-sm text-neutral-400 transition hover:text-red-600 disabled:opacity-60"
                        >
                          {tCommon("archive")}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

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