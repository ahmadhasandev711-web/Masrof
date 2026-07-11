"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createInvoiceAction,
  type CreateInvoiceState,
} from "@/features/invoices/actions/create-invoice";
import { useTranslations } from "next-intl";

type ClientOption = { _id: string; name: string };

const initialState: CreateInvoiceState = { error: null, redirectTo: null };

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

type LineRow = { id: number };

export function CreateInvoiceForm({
  workspaceId,
  clients,
  defaultClientId,
}: {
  workspaceId: string;
  clients: ClientOption[];
  defaultClientId?: string;
}) {
  const tForm = useTranslations("forms.invoice");
  const tShared = useTranslations("forms.shared");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createInvoiceAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [rows, setRows] = useState<LineRow[]>([{ id: 1 }]);
  const nextRowId = useRef(2);

  useEffect(() => {
    if (!state.redirectTo) return;
    router.replace(state.redirectTo);
  }, [state.redirectTo, router]);

  function addRow() {
    setRows((current) => [...current, { id: nextRowId.current++ }]);
  }

  function removeRow(id: number) {
    setRows((current) => (current.length <= 1 ? current : current.filter((row) => row.id !== id)));
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
    >
      <input type="hidden" name="workspaceId" value={workspaceId} />

      <div>
        <h2 className="font-semibold text-neutral-900">{tForm("title")}</h2>
        <p className="mt-1 text-sm text-neutral-500">{tForm("submit")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="invoice-client" className="text-sm font-medium text-neutral-700">
            {tForm("client")}
          </label>
          <select
            id="invoice-client"
            name="clientId"
            defaultValue={defaultClientId ?? ""}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-right"
            required
          >
            <option value="" disabled>
              {tForm("client")}
            </option>
            {clients.map((client) => (
              <option key={client._id} value={client._id}>
                {client.name}
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
            className="rounded-lg border border-neutral-300 px-3 py-2 text-right"
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
            className="rounded-lg border border-neutral-300 px-3 py-2 text-right"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-neutral-700">{tForm("items")}</p>
        {rows.map((row, index) => (
          <div
            key={row.id}
            className="grid gap-2 rounded-lg border border-neutral-200 p-3 sm:grid-cols-[1fr_140px_auto]"
          >
            <input
              name={`itemDescription_${index}`}
              type="text"
              placeholder={tForm("itemDescriptionPlaceholder")}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-right text-sm"
              required
            />
            <input
              name={`itemAmount_${index}`}
              type="number"
              step="0.01"
              min="0.01"
              placeholder={tForm("itemAmount")}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-right text-sm"
              required
            />
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              disabled={rows.length <= 1}
              className="text-sm text-neutral-400 hover:text-red-600 disabled:opacity-40"
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

      <div className="flex flex-col gap-1.5">
        <label htmlFor="invoice-notes" className="text-sm font-medium text-neutral-700">
          {tForm("notes")}
        </label>
        <textarea
          id="invoice-notes"
          name="notes"
          rows={2}
          placeholder={tForm("notesPlaceholder")}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-right text-sm"
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || clients.length === 0}
        className="self-start rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {isPending ? tCommon("saving") : tForm("submit")}
      </button>
    </form>
  );
}
