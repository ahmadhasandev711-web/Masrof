"use client";

import { useTransition } from "react";
import { archiveClientAction } from "@/features/clients/actions/archive-client";
import type { ClientListItem } from "@/features/clients/types";
import { useTranslations } from "next-intl";

function ArchiveClientButton({
  clientId,
  workspaceId,
}: {
  clientId: string;
  workspaceId: string;
}) {
  const tConfirm = useTranslations("confirm");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        if (!confirm(tConfirm("archiveClient"))) return;
        startTransition(() => archiveClientAction(clientId, workspaceId));
      }}
      disabled={isPending}
      className="text-sm text-neutral-400 transition hover:text-red-600 disabled:opacity-60"
    >
      {tCommon("archive")}
    </button>
  );
}

export function ClientList({
  clients,
  workspaceId,
}: {
  clients: ClientListItem[];
  workspaceId: string;
}) {
  const tEmpty = useTranslations("empty");
  const tNav = useTranslations("nav");
  if (clients.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-400">
        {tEmpty("noClients")}
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {clients.map((client) => {
        const id = client._id;
        return (
          <li
            key={id}
            className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-5 py-4 shadow-sm"
          >
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
              <a
                href={`/dashboard/invoices?clientId=${id}`}
                className="text-sm font-medium text-emerald-700 hover:underline"
              >
                {tNav("invoices")}
              </a>
              <ArchiveClientButton clientId={id} workspaceId={workspaceId} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
