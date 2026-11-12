"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { MOBILE_FIELD } from "@/components/ui/mobile-field";
import { fromMinorUnits } from "@/lib/money";
import type { InvoiceTemplateListItem } from "@/features/invoices/invoice-templates.types";
import {
  saveInvoiceTemplateAction,
  updateInvoiceTemplateAction,
} from "@/features/invoices/actions/invoice-templates";

type LineRow = {
  id: number;
  description: string;
  quantity: string;
  unitPrice: string;
};

export function InvoiceTemplateForm({
  workspaceId,
  template,
  onCancel,
  onSuccess,
}: {
  workspaceId: string;
  template?: InvoiceTemplateListItem;
  onCancel?: () => void;
  onSuccess?: () => void;
}) {
  const t = useTranslations("pages.invoiceTemplates");
  const tForm = useTranslations("forms.invoice");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(template?.name ?? "");
  const [taxEnabled, setTaxEnabled] = useState(Boolean(template?.taxEnabled));
  const [taxRatePercent, setTaxRatePercent] = useState(
    String(template?.taxRatePercent || 14),
  );
  const [rows, setRows] = useState<LineRow[]>(() =>
    template?.items?.length
      ? template.items.map((item, index) => ({
          id: index + 1,
          description: item.description,
          quantity: String(item.quantity),
          unitPrice: String(fromMinorUnits(item.unitPrice)),
        }))
      : [{ id: 1, description: "", quantity: "1", unitPrice: "" }],
  );
  const [nextId, setNextId] = useState((template?.items?.length ?? 1) + 1);

  const subtotalMajor = useMemo(
    () =>
      rows.reduce((sum, row) => {
        const qty = parseFloat(row.quantity);
        const price = parseFloat(row.unitPrice);
        if (!Number.isFinite(qty) || !Number.isFinite(price)) return sum;
        return sum + qty * price;
      }, 0),
    [rows],
  );

  function addRow() {
    setRows((current) => [
      ...current,
      { id: nextId, description: "", quantity: "1", unitPrice: "" },
    ]);
    setNextId((n) => n + 1);
  }

  function removeRow(id: number) {
    setRows((current) => (current.length <= 1 ? current : current.filter((r) => r.id !== id)));
  }

  function updateRow(id: number, patch: Partial<LineRow>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const items = rows.map((row) => ({
      description: row.description.trim(),
      quantity: parseFloat(row.quantity),
      unitPrice: parseFloat(row.unitPrice),
    }));

    if (!name.trim()) {
      setError(t("name"));
      return;
    }
    if (
      items.some(
        (item) =>
          !item.description ||
          !Number.isFinite(item.quantity) ||
          item.quantity <= 0 ||
          !Number.isFinite(item.unitPrice) ||
          item.unitPrice <= 0,
      )
    ) {
      setError(tForm("itemAmount"));
      return;
    }

    startTransition(async () => {
      const payload = {
        workspaceId,
        name: name.trim(),
        items,
        taxEnabled,
        taxRatePercent: taxEnabled ? parseFloat(taxRatePercent) || 0 : 0,
      };
      const res = template
        ? await updateInvoiceTemplateAction({ ...payload, templateId: template.id })
        : await saveInvoiceTemplateAction(payload);

      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
      onSuccess?.();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-neutral-700">{t("name")}</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("namePlaceholder")}
          className={`${MOBILE_FIELD} text-right`}
          required
        />
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-neutral-700">{tForm("items")}</p>
        {rows.map((row) => (
          <div
            key={row.id}
            className="grid gap-2 rounded-lg border border-neutral-200 p-3 sm:grid-cols-[1fr_88px_110px_auto]"
          >
            <input
              value={row.description}
              onChange={(e) => updateRow(row.id, { description: e.target.value })}
              placeholder={tForm("itemDescriptionPlaceholder")}
              className={`${MOBILE_FIELD} text-right`}
              required
            />
            <input
              type="number"
              step="0.01"
              min="0.01"
              inputMode="decimal"
              enterKeyHint="done"
              value={row.quantity}
              onChange={(e) => updateRow(row.id, { quantity: e.target.value })}
              className={`${MOBILE_FIELD} text-start font-mono`}
              required
            />
            <input
              type="number"
              step="0.01"
              min="0.01"
              inputMode="decimal"
              enterKeyHint="done"
              value={row.unitPrice}
              onChange={(e) => updateRow(row.id, { unitPrice: e.target.value })}
              className={`${MOBILE_FIELD} text-start font-mono font-bold`}
              required
            />
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              disabled={rows.length <= 1}
              className="min-h-11 text-sm text-neutral-400 hover:text-red-600 disabled:opacity-40"
            >
              {tCommon("delete")}
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addRow}
          className="self-start text-sm font-medium text-emerald-700 hover:underline"
        >
          {tForm("addItem")}
        </button>
      </div>

      <div className="rounded-lg border border-neutral-200 p-3">
        <label className="flex min-h-11 items-center gap-2 text-sm font-medium text-neutral-800">
          <input
            type="checkbox"
            checked={taxEnabled}
            onChange={(e) => setTaxEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300"
          />
          {tForm("enableTax")}
        </label>
        {taxEnabled && (
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            inputMode="decimal"
            value={taxRatePercent}
            onChange={(e) => setTaxRatePercent(e.target.value)}
            className={`${MOBILE_FIELD} mt-2 max-w-[140px] text-start font-mono`}
            aria-label={tForm("taxRate")}
          />
        )}
        <p className="mt-2 text-xs text-neutral-500 font-mono">
          {tForm("subtotal")}: {subtotalMajor.toFixed(2)}
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-2.5 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          {isPending ? tCommon("saving") : template ? t("save") : t("create")}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            {tCommon("cancel")}
          </button>
        )}
      </div>
    </form>
  );
}
