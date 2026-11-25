"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import { NavIcon } from "@/components/ui/app-icons";
import { MOBILE_ACTION_BTN } from "@/components/ui/mobile-field";
import type { InvoiceTemplateListItem } from "@/features/invoices/invoice-templates.types";
import { InvoiceTemplateForm } from "@/features/invoices/components/invoice-template-form";
import {
  archiveInvoiceTemplateAction,
  reorderInvoiceTemplatesAction,
} from "@/features/invoices/actions/invoice-templates";

export function InvoiceTemplatesManager({
  workspaceId,
  templates,
  canWrite,
}: {
  workspaceId: string;
  templates: InvoiceTemplateListItem[];
  canWrite: boolean;
}) {
  const t = useTranslations("pages.invoiceTemplates");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<InvoiceTemplateListItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ordered = useMemo(
    () => [...templates].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [templates],
  );

  function move(templateId: string, direction: -1 | 1) {
    const index = ordered.findIndex((t) => t.id === templateId);
    const swapWith = index + direction;
    if (index < 0 || swapWith < 0 || swapWith >= ordered.length) return;
    const next = [...ordered];
    const tmp = next[index]!;
    next[index] = next[swapWith]!;
    next[swapWith] = tmp;
    setError(null);
    startTransition(async () => {
      const res = await reorderInvoiceTemplatesAction({
        workspaceId,
        orderedIds: next.map((item) => item.id),
      });
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  function archive(templateId: string) {
    if (!confirm(t("archiveConfirm"))) return;
    setError(null);
    startTransition(async () => {
      const res = await archiveInvoiceTemplateAction({ workspaceId, templateId });
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {canWrite && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-[#065F46] dark:bg-[#10B981] px-4 py-2.5 text-sm font-semibold text-white dark:text-[#04231A] hover:bg-[#054E3A] dark:hover:bg-[#34D399]"
          >
            <span>+</span>
            <span>{t("newTemplate")}</span>
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 dark:bg-rose-950/30 p-2.5 text-sm text-red-700 dark:text-rose-300">
          {error}
        </p>
      )}

      {ordered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 dark:border-[#26302C] bg-white dark:bg-[#161E1B] p-10 text-center text-sm text-neutral-500 dark:text-[#9AA39F]">
          {t("empty")}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {ordered.map((template, index) => (
            <li
              key={template.id}
              className="rounded-2xl border border-neutral-200 dark:border-[#26302C] bg-white dark:bg-[#161E1B] p-4 shadow-xs"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-semibold text-neutral-900 dark:text-[#ECEAE4]">{template.name}</h2>
                  <p className="mt-1 text-xs text-neutral-500 dark:text-[#9AA39F]">
                    {t("itemsCount", { count: template.items.length })}
                    {" · "}
                    {template.taxEnabled
                      ? t("taxOn", { rate: template.taxRatePercent })
                      : t("taxOff")}
                  </p>
                  <ul className="mt-2 space-y-0.5 text-xs text-neutral-600 dark:text-[#9AA39F]">
                    {template.items.slice(0, 3).map((item, i) => (
                      <li key={`${template.id}-${i}`}>
                        {item.quantity} × {item.description}
                      </li>
                    ))}
                    {template.items.length > 3 && (
                      <li className="text-neutral-400 dark:text-[#66706B]">…</li>
                    )}
                  </ul>
                </div>

                {canWrite && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={isPending || index === 0}
                      onClick={() => move(template.id, -1)}
                      className={`${MOBILE_ACTION_BTN} border-neutral-200 dark:border-[#26302C] bg-white dark:bg-[#1E2824] text-neutral-700 dark:text-[#ECEAE4] hover:bg-neutral-50 dark:hover:bg-[#26302C] disabled:opacity-40`}
                    >
                      <span>{t("moveUp")}</span>
                    </button>
                    <button
                      type="button"
                      disabled={isPending || index === ordered.length - 1}
                      onClick={() => move(template.id, 1)}
                      className={`${MOBILE_ACTION_BTN} border-neutral-200 dark:border-[#26302C] bg-white dark:bg-[#1E2824] text-neutral-700 dark:text-[#ECEAE4] hover:bg-neutral-50 dark:hover:bg-[#26302C] disabled:opacity-40`}
                    >
                      <span>{t("moveDown")}</span>
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setEditing(template)}
                      className={`${MOBILE_ACTION_BTN} border-neutral-200 dark:border-[#26302C] bg-white dark:bg-[#1E2824] text-neutral-700 dark:text-[#ECEAE4] hover:bg-neutral-50 dark:hover:bg-[#26302C]`}
                    >
                      <NavIcon name="edit" className="h-4 w-4 shrink-0" />
                      <span>{t("editTemplate")}</span>
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => archive(template.id)}
                      className={`${MOBILE_ACTION_BTN} border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/15 text-rose-800 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/25`}
                    >
                      <NavIcon name="trash" className="h-4 w-4 shrink-0" />
                      <span>{t("archive")}</span>
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        isOpen={creating}
        onClose={() => setCreating(false)}
        title={t("newTemplate")}
        maxWidthClassName="max-w-3xl"
      >
        <InvoiceTemplateForm
          workspaceId={workspaceId}
          onCancel={() => setCreating(false)}
          onSuccess={() => setCreating(false)}
        />
      </Modal>

      <Modal
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title={t("editTemplate")}
        maxWidthClassName="max-w-3xl"
      >
        {editing && (
          <InvoiceTemplateForm
            workspaceId={workspaceId}
            template={editing}
            onCancel={() => setEditing(null)}
            onSuccess={() => setEditing(null)}
          />
        )}
      </Modal>
    </div>
  );
}
