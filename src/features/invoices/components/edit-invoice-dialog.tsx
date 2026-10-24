"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { updateInvoiceAction } from "@/features/invoices/actions/update-invoice";
import type { InvoiceListItem } from "@/features/invoices/types";
import type { ComboboxClientItem } from "@/features/clients/components/client-combobox";
import { ClientCombobox } from "@/features/clients/components/client-combobox";
import { formatMoney } from "@/lib/money";

type ProjectOption = { _id: string; name: string; clientId: string };

type ItemRow = {
  id: number;
  description: string;
  amount: string;
};

export function EditInvoiceDialog({
  workspaceId,
  invoice,
  clients,
  projects = [],
  isOpen,
  onClose,
}: {
  workspaceId: string;
  invoice: InvoiceListItem;
  clients: ComboboxClientItem[];
  projects?: ProjectOption[];
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

  const [rows, setRows] = useState<ItemRow[]>(() =>
    invoice.items && invoice.items.length > 0
      ? invoice.items.map((it, idx) => ({
          id: idx + 1,
          description: it.description,
          amount: (it.amount / 100).toString(),
        }))
      : [{ id: 1, description: "", amount: "" }]
  );

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const availableProjects = projects.filter((p) => p.clientId === selectedClientId);

  const totalCalculatedMajor = rows.reduce((sum, r) => {
    const val = parseFloat(r.amount);
    return isNaN(val) ? sum : sum + val;
  }, 0);

  function addRow() {
    setRows((current) => [...current, { id: Date.now() + Math.random(), description: "", amount: "" }]);
  }

  function removeRow(id: number) {
    if (rows.length <= 1) return;
    setRows((current) => current.filter((r) => r.id !== id));
  }

  function updateRow(id: number, field: "description" | "amount", value: string) {
    setRows((current) =>
      current.map((r) => (r.id === id ? { ...r, [field]: value } : r))
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
      amount: parseFloat(r.amount),
    }));

    for (const item of parsedItems) {
      if (!item.description) {
        setError(tInvoices("itemDescriptionError"));
        return;
      }
      if (isNaN(item.amount) || item.amount <= 0) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <button
        type="button"
        className="fixed inset-0 bg-black/60 transition-opacity"
        aria-label={tCommon("close")}
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 max-h-[85dvh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-[#E4DFD3] bg-[#FBF9F4] p-5 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200 sm:p-7 overscroll-contain">
        <div className="mb-4 flex items-center justify-between border-b border-[#E4DFD3] pb-3">
          <div>
            <h2 className="text-base font-bold text-neutral-900 sm:text-lg">
              {tInvoices("editInvoiceTitle", { number: invoice.invoiceNumber })}
            </h2>
            <p className="text-xs text-neutral-500">
              {tInvoices("editInvoiceSubtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700"
            aria-label={tCommon("close")}
          >
            ✕
          </button>
        </div>

        {invoice.paidAmount > 0 && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
            {tInvoices("paidAmountWarning", { amount: formatMoney(invoice.paidAmount) })}
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
                className="rounded-lg border border-neutral-300 px-3 py-2 text-right text-sm disabled:opacity-50"
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
                className="rounded-lg border border-neutral-300 px-3 py-2 text-right text-sm"
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
                className="rounded-lg border border-neutral-300 px-3 py-2 text-right text-sm"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-700">{tForm("items")}</p>
              <span className="text-xs font-semibold text-neutral-600">
                {tInvoices("newTotalCalculated", {
                  amount: formatMoney(Math.round(totalCalculatedMajor * 100)),
                })}
              </span>
            </div>

            {rows.map((row) => (
              <div
                key={row.id}
                className="grid gap-2 rounded-lg border border-neutral-200 bg-white/50 p-3 sm:grid-cols-[1fr_140px_auto]"
              >
                <input
                  type="text"
                  placeholder={tForm("itemDescriptionPlaceholder")}
                  value={row.description}
                  onChange={(e) => updateRow(row.id, "description", e.target.value)}
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-right text-sm"
                  required
                />
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={row.amount}
                  onChange={(e) => updateRow(row.id, "amount", e.target.value)}
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-left text-sm font-mono"
                  dir="ltr"
                  required
                />
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  disabled={rows.length <= 1}
                  className="self-center rounded-lg border border-neutral-300 px-3 py-2 text-xs text-neutral-600 hover:bg-neutral-100 disabled:opacity-30"
                  aria-label={tForm("removeItem")}
                >
                  
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
              className="rounded-lg border border-neutral-300 px-3 py-2 text-right text-sm"
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
      </div>
    </div>
  );
}
