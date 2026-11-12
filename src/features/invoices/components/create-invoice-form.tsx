"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useIdempotencyKey } from "@/hooks/use-idempotency-key";
import { IdempotencyKeyInput } from "@/components/idempotency-key-input";
import { useRouter } from "next/navigation";
import {
  createInvoiceAction,
  type CreateInvoiceState,
} from "@/features/invoices/actions/create-invoice";
import {
  ClientCombobox,
  type ComboboxClientItem,
} from "@/features/clients/components/client-combobox";
import { useTranslations } from "next-intl";
import { MOBILE_FIELD } from "@/components/ui/mobile-field";
import { fromMinorUnits } from "@/lib/money";
import type { InvoiceTemplateListItem } from "@/features/invoices/invoice-templates.types";
import { saveInvoiceTemplateAction } from "@/features/invoices/actions/invoice-templates";

type ClientOption = ComboboxClientItem;
type ProjectOption = { _id: string; name: string; clientId: string };

const initialState: CreateInvoiceState = { error: null, redirectTo: null };

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

type LineRow = {
  id: number;
  description: string;
  quantity: string;
  unitPrice: string;
};

export function CreateInvoiceForm({
  workspaceId,
  clients,
  projects = [],
  templates = [],
  defaultClientId,
  defaultProjectId,
  onCancel,
}: {
  workspaceId: string;
  clients: ClientOption[];
  projects?: ProjectOption[];
  templates?: InvoiceTemplateListItem[];
  defaultClientId?: string;
  defaultProjectId?: string;
  onCancel?: () => void;
}) {
  const tForm = useTranslations("forms.invoice");
  const tShared = useTranslations("forms.shared");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createInvoiceAction, initialState);
  const { idempotencyKey } = useIdempotencyKey();
  const formRef = useRef<HTMLFormElement>(null);

  const initialProject = defaultProjectId ? projects.find((p) => p._id === defaultProjectId) : null;
  const initialClientId = defaultClientId ?? initialProject?.clientId ?? "";

  const [selectedClientId, setSelectedClientId] = useState<string>(initialClientId);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(defaultProjectId ?? "");
  const [rows, setRows] = useState<LineRow[]>([
    { id: 1, description: "", quantity: "1", unitPrice: "" },
  ]);
  const nextRowId = useRef(2);
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRatePercent, setTaxRatePercent] = useState("14");
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateMessage, setTemplateMessage] = useState<string | null>(null);

  const availableProjects = projects.filter((p) => p.clientId === selectedClientId);

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
  const taxRate = taxEnabled ? parseFloat(taxRatePercent) || 0 : 0;
  const taxMajor = taxEnabled ? (subtotalMajor * taxRate) / 100 : 0;
  const totalMajor = subtotalMajor + taxMajor;

  useEffect(() => {
    if (!state.redirectTo) return;
    router.replace(state.redirectTo);
  }, [state.redirectTo, router]);

  function addRow() {
    setRows((current) => [
      ...current,
      { id: nextRowId.current++, description: "", quantity: "1", unitPrice: "" },
    ]);
  }

  function removeRow(id: number) {
    setRows((current) => (current.length <= 1 ? current : current.filter((row) => row.id !== id)));
  }

  function updateRow(id: number, patch: Partial<LineRow>) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function applyTemplate(templateId: string) {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    setRows(
      template.items.map((item, index) => ({
        id: nextRowId.current + index,
        description: item.description,
        quantity: String(item.quantity),
        unitPrice: String(fromMinorUnits(item.unitPrice)),
      })),
    );
    nextRowId.current += template.items.length + 1;
    setTaxEnabled(template.taxEnabled);
    if (template.taxEnabled) {
      setTaxRatePercent(String(template.taxRatePercent || 14));
    }
  }

  async function handleSaveTemplate() {
    const name = window.prompt(tForm("templateName"));
    if (!name?.trim()) return;
    setTemplateSaving(true);
    setTemplateMessage(null);
    try {
      const res = await saveInvoiceTemplateAction({
        workspaceId,
        name: name.trim(),
        taxEnabled,
        taxRatePercent: taxEnabled ? parseFloat(taxRatePercent) || 0 : 0,
        items: rows.map((row) => ({
          description: row.description,
          quantity: parseFloat(row.quantity) || 1,
          unitPrice: parseFloat(row.unitPrice) || 0,
        })),
      });
      setTemplateMessage(res.error);
      if (!res.error) {
        setTemplateMessage(tForm("saveAsTemplate"));
        router.refresh();
      }
    } finally {
      setTemplateSaving(false);
    }
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
    >
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <IdempotencyKeyInput value={idempotencyKey} />
      <input type="hidden" name="taxEnabled" value={taxEnabled ? "true" : "false"} />

      <div>
        <h2 className="font-semibold text-neutral-900">{tForm("title")}</h2>
        <p className="mt-1 text-sm text-neutral-500">{tForm("submit")}</p>
      </div>

      {templates.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-700">{tForm("applyTemplate")}</label>
          <select
            className={`${MOBILE_FIELD} text-right`}
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) applyTemplate(e.target.value);
              e.target.value = "";
            }}
          >
            <option value="">{tForm("selectTemplate")}</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="invoice-client" className="text-sm font-medium text-neutral-700">
            {tForm("client")}
          </label>
          <ClientCombobox
            id="invoice-client"
            name="clientId"
            clients={clients}
            value={selectedClientId}
            onChange={(newClientId) => {
              setSelectedClientId(newClientId);
              setSelectedProjectId("");
            }}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="invoice-project" className="text-sm font-medium text-neutral-700">
            {tForm("project")} ({tShared("optional")})
          </label>
          <select
            id="invoice-project"
            name="projectId"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            disabled={!selectedClientId || availableProjects.length === 0}
            className={`${MOBILE_FIELD} text-right disabled:bg-neutral-100 disabled:text-neutral-400`}
          >
            <option value="">{tForm("noProject")}</option>
            {availableProjects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="invoice-issue-date" className="text-sm font-medium text-neutral-700">
            {tForm("issueDate")}
          </label>
          <input
            id="invoice-issue-date"
            name="issueDate"
            type="date"
            defaultValue={todayIsoDate()}
            className={`${MOBILE_FIELD} text-right`}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="invoice-due-date" className="text-sm font-medium text-neutral-700">
            {tForm("dueDate")} ({tShared("optional")})
          </label>
          <input
            id="invoice-due-date"
            name="dueDate"
            type="date"
            className={`${MOBILE_FIELD} text-right`}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-neutral-700">{tForm("items")}</p>
        {rows.map((row, index) => {
          const qty = parseFloat(row.quantity);
          const price = parseFloat(row.unitPrice);
          const lineTotal =
            Number.isFinite(qty) && Number.isFinite(price) ? qty * price : 0;
          return (
            <div
              key={row.id}
              className="grid gap-2 rounded-lg border border-neutral-200 p-3 sm:grid-cols-[1fr_88px_110px_110px_auto]"
            >
              <input
                name={`itemDescription_${index}`}
                type="text"
                value={row.description}
                onChange={(e) => updateRow(row.id, { description: e.target.value })}
                placeholder={tForm("itemDescriptionPlaceholder")}
                className={`${MOBILE_FIELD} text-right`}
                required
              />
              <input
                name={`itemQuantity_${index}`}
                type="number"
                step="0.01"
                min="0.01"
                inputMode="decimal"
                enterKeyHint="done"
                dir="ltr"
                value={row.quantity}
                onChange={(e) => updateRow(row.id, { quantity: e.target.value })}
                placeholder={tForm("itemQuantity")}
                className={`${MOBILE_FIELD} text-start font-mono`}
                required
              />
              <input
                name={`itemUnitPrice_${index}`}
                type="number"
                step="0.01"
                min="0.01"
                inputMode="decimal"
                enterKeyHint="done"
                dir="ltr"
                value={row.unitPrice}
                onChange={(e) => updateRow(row.id, { unitPrice: e.target.value })}
                placeholder={tForm("itemUnitPrice")}
                className={`${MOBILE_FIELD} text-start font-mono font-bold`}
                required
              />
              <div className={`${MOBILE_FIELD} flex items-center justify-start bg-neutral-50 font-mono text-sm text-neutral-700`}>
                {lineTotal > 0 ? lineTotal.toFixed(2) : "—"}
              </div>
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                disabled={rows.length <= 1}
                className="min-h-11 text-sm text-neutral-400 hover:text-red-600 disabled:opacity-40"
              >
                {tCommon("delete")}
              </button>
            </div>
          );
        })}
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
          <div className="mt-3 flex flex-col gap-1.5">
            <label htmlFor="tax-rate" className="text-xs font-semibold text-neutral-600">
              {tForm("taxRate")}
            </label>
            <input
              id="tax-rate"
              name="taxRatePercent"
              type="number"
              step="0.01"
              min="0"
              max="100"
              inputMode="decimal"
              enterKeyHint="done"
              value={taxRatePercent}
              onChange={(e) => setTaxRatePercent(e.target.value)}
              className={`${MOBILE_FIELD} max-w-[140px] text-start font-mono`}
            />
          </div>
        )}
        {!taxEnabled && <input type="hidden" name="taxRatePercent" value="0" />}
        <div className="mt-3 space-y-1 text-sm text-neutral-700">
          <div className="flex justify-between">
            <span>{tForm("subtotal")}</span>
            <span className="font-mono">{subtotalMajor.toFixed(2)}</span>
          </div>
          {taxEnabled && (
            <div className="flex justify-between">
              <span>{tForm("taxAmount")}</span>
              <span className="font-mono">{taxMajor.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-neutral-200 pt-1 font-semibold">
            <span>{tForm("total")}</span>
            <span className="font-mono">{totalMajor.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="invoice-notes" className="text-sm font-medium text-neutral-700">
          {tForm("notes")}
        </label>
        <textarea
          id="invoice-notes"
          name="notes"
          rows={2}
          placeholder={tForm("notesPlaceholder")}
          className={`${MOBILE_FIELD} text-right`}
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      {templateMessage && (
        <p className="text-sm text-neutral-600" role="status">
          {templateMessage}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending || clients.length === 0}
          className="rounded-lg bg-emerald-700 px-5 py-2.5 font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          {isPending ? tCommon("saving") : tForm("submit")}
        </button>
        <button
          type="button"
          onClick={handleSaveTemplate}
          disabled={templateSaving || isPending}
          className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
        >
          {tForm("saveAsTemplate")}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-lg border border-neutral-300 px-4 py-2.5 font-medium text-neutral-700 hover:bg-neutral-100"
          >
            {tCommon("cancel")}
          </button>
        )}
      </div>
    </form>
  );
}
