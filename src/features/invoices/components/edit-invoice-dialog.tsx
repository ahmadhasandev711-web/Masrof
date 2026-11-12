"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import { updateInvoiceAction } from "@/features/invoices/actions/update-invoice";
import type { InvoiceListItem } from "@/features/invoices/types";
import type { ComboboxClientItem } from "@/features/clients/components/client-combobox";
import { ClientCombobox } from "@/features/clients/components/client-combobox";
import { formatMoney, fromMinorUnits } from "@/lib/money";
import { MOBILE_FIELD } from "@/components/ui/mobile-field";

type ProjectOption = { _id: string; name: string; clientId: string };

type ItemRow = {
  id: number;
  description: string;
  quantity: string;
  unitPrice: string;
};

export function EditInvoiceDialog({
  workspaceId,
  invoice,
  clients,
  projects = [],
  currency,
  isOpen,
  onClose,
}: {
  workspaceId: string;
  invoice: InvoiceListItem;
  clients: ComboboxClientItem[];
  projects?: ProjectOption[];
  currency: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const tCommon = useTranslations("common");
  const tForm = useTranslations("forms.invoice");
  const tShared = useTranslations("forms.shared");
  const tInvoices = useTranslations("pages.invoices");

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [selectedClientId, setSelectedClientId] = useState<string>(invoice.clientId);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(invoice.projectId ?? "");
  const [issueDate, setIssueDate] = useState<string>(invoice.issueDate.slice(0, 10));
  const [dueDate, setDueDate] = useState<string>(invoice.dueDate ? invoice.dueDate.slice(0, 10) : "");
  const [notes, setNotes] = useState<string>(invoice.notes ?? "");
  const [taxEnabled, setTaxEnabled] = useState(Boolean(invoice.taxEnabled));
  const [taxRatePercent, setTaxRatePercent] = useState(
    String(invoice.taxRatePercent || 14),
  );

  const [rows, setRows] = useState<ItemRow[]>(() =>
    invoice.items && invoice.items.length > 0
      ? invoice.items.map((it, idx) => ({
          id: idx + 1,
          description: it.description,
          quantity: String(it.quantity ?? 1),
          unitPrice: String(fromMinorUnits(it.unitPrice ?? it.amount)),
        }))
      : [{ id: 1, description: "", quantity: "1", unitPrice: "" }],
  );

  const availableProjects = projects.filter((p) => p.clientId === selectedClientId);

  const subtotalMajor = rows.reduce((sum, r) => {
    const qty = parseFloat(r.quantity);
    const price = parseFloat(r.unitPrice);
    if (!Number.isFinite(qty) || !Number.isFinite(price)) return sum;
    return sum + qty * price;
  }, 0);
  const taxMajor = taxEnabled ? (subtotalMajor * (parseFloat(taxRatePercent) || 0)) / 100 : 0;
  const totalCalculatedMajor = subtotalMajor + taxMajor;

  function addRow() {
    setRows((current) => [
      ...current,
      { id: Date.now() + Math.random(), description: "", quantity: "1", unitPrice: "" },
    ]);
  }

  function removeRow(id: number) {
    if (rows.length <= 1) return;
    setRows((current) => current.filter((r) => r.id !== id));
  }

  function updateRow(id: number, field: keyof ItemRow, value: string) {
    setRows((current) =>
      current.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selectedClientId) {
      setError(tInvoices("selectClientError"));
      return;
    }

    const parsedItems = rows.map((r) => ({
      description: r.description.trim(),
      quantity: parseFloat(r.quantity),
      unitPrice: parseFloat(r.unitPrice),
    }));

    for (const item of parsedItems) {
      if (!item.description) {
        setError(tInvoices("itemDescriptionError"));
        return;
      }
      if (
        !Number.isFinite(item.quantity) ||
        item.quantity <= 0 ||
        !Number.isFinite(item.unitPrice) ||
        item.unitPrice <= 0
      ) {
        setError(tInvoices("itemAmountError"));
        return;
      }
    }

    startTransition(async () => {
      try {
        const res = await updateInvoiceAction({
          workspaceId,
          invoiceId: invoice._id,
          clientId: selectedClientId,
          projectId: selectedProjectId || null,
          issueDate: new Date(issueDate),
          dueDate: dueDate ? new Date(dueDate) : null,
          notes: notes.trim(),
          items: parsedItems,
          taxEnabled,
          taxRatePercent: taxEnabled ? parseFloat(taxRatePercent) || 0 : 0,
        });

        if (res?.error) {
          setError(res.error);
        } else {
          router.refresh();
          onClose();
        }
      } catch {
        setError(tInvoices("saveError"));
      }
    });
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={tInvoices("editInvoiceTitle", { number: invoice.invoiceNumber })}
      subtitle={tInvoices("editInvoiceSubtitle")}
      maxWidthClassName="max-w-3xl"
    >
      {invoice.paidAmount > 0 && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
          {tInvoices("paidAmountWarning", { amount: formatMoney(invoice.paidAmount, { currency }) })}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-neutral-700">{tForm("client")}</label>
              <ClientCombobox
                clients={clients}
                value={selectedClientId}
                onChange={(val) => {
                  setSelectedClientId(val);
                  setSelectedProjectId("");
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-invoice-project" className="text-sm font-medium text-neutral-700">
                {tForm("project")} ({tShared("optional")})
              </label>
              <select
                id="edit-invoice-project"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                disabled={!selectedClientId || availableProjects.length === 0}
                className={`${MOBILE_FIELD} text-right disabled:opacity-50`}
              >
                <option value="">— {tShared("none")} —</option>
                {availableProjects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-invoice-issue-date" className="text-sm font-medium text-neutral-700">
                {tForm("issueDate")}
              </label>
              <input
                id="edit-invoice-issue-date"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className={`${MOBILE_FIELD} text-right`}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-invoice-due-date" className="text-sm font-medium text-neutral-700">
                {tForm("dueDate")} ({tShared("optional")})
              </label>
              <input
                id="edit-invoice-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`${MOBILE_FIELD} text-right`}
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-700">{tForm("items")}</p>
              <span className="text-xs font-semibold text-neutral-600">
                {tInvoices("newTotalCalculated", {
                  amount: formatMoney(Math.round(totalCalculatedMajor * 100), { currency }),
                })}
              </span>
            </div>

            {rows.map((row) => (
              <div
                key={row.id}
                className="grid gap-2 rounded-lg border border-neutral-200 bg-white/50 p-3 sm:grid-cols-[1fr_88px_110px_auto]"
              >
                <input
                  type="text"
                  placeholder={tForm("itemDescriptionPlaceholder")}
                  value={row.description}
                  onChange={(e) => updateRow(row.id, "description", e.target.value)}
                  className={`${MOBILE_FIELD} text-right`}
                  required
                />
                <input
                  type="number"
                  inputMode="decimal"
                  enterKeyHint="done"
                  step="0.01"
                  min="0.01"
                  placeholder={tForm("itemQuantity")}
                  value={row.quantity}
                  onChange={(e) => updateRow(row.id, "quantity", e.target.value)}
                  className={`${MOBILE_FIELD} text-left font-mono`}
                  dir="ltr"
                  required
                />
                <input
                  type="number"
                  inputMode="decimal"
                  enterKeyHint="done"
                  step="0.01"
                  min="0.01"
                  placeholder={tForm("itemUnitPrice")}
                  value={row.unitPrice}
                  onChange={(e) => updateRow(row.id, "unitPrice", e.target.value)}
                  className={`${MOBILE_FIELD} text-left font-mono`}
                  dir="ltr"
                  required
                />
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  disabled={rows.length <= 1}
                  className="self-center min-h-11 rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 disabled:opacity-30"
                >
                  {tCommon("delete")}
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addRow}
              className="self-start rounded-lg border border-dashed border-neutral-300 px-4 py-1.5 text-xs font-medium text-neutral-600 hover:border-neutral-400"
            >
              + {tForm("addItem")}
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
            <div className="mt-2 space-y-1 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>{tForm("subtotal")}</span>
                <span className="font-mono">{formatMoney(Math.round(subtotalMajor * 100), { currency })}</span>
              </div>
              {taxEnabled && (
                <div className="flex justify-between">
                  <span>{tForm("taxAmount")}</span>
                  <span className="font-mono">{formatMoney(Math.round(taxMajor * 100), { currency })}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-invoice-notes" className="text-sm font-medium text-neutral-700">
              {tForm("notes")} ({tShared("optional")})
            </label>
            <textarea
              id="edit-invoice-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder={tForm("notesPlaceholder")}
              className={`${MOBILE_FIELD} text-right`}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 p-2.5 text-xs font-medium text-red-700 border border-red-200">
              {error}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-emerald-700 px-5 py-2.5 font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {isPending ? tCommon("saving") : tCommon("saveChanges")}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-lg border border-neutral-300 px-4 py-2.5 font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-60"
            >
              {tCommon("cancel")}
            </button>
          </div>
        </form>
    </Modal>
  );
}
