"use client";

import { useActionState, useMemo, useRef, useState, useEffect } from "react";
import {
  createTransactionAction,
  type CreateTransactionState,
} from "@/features/transactions/actions/create-transaction";
import { ClientCombobox } from "@/features/clients/components/client-combobox";
import { useTranslations } from "next-intl";

type AccountOption = { id: string; name: string };
type CategoryOption = { id: string; name: string; kind: "income" | "expense"; icon?: string | null };
type LinkOption = { id: string; name: string; phone?: string | null };

const initialState: CreateTransactionState = { error: null };

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function CreateTransactionForm({
  workspaceId,
  accounts,
  categories,
  clients = [],
  projects = [],
  defaultProjectId,
  ocrReceipts = false,
  aiCategory = false,
}: {
  workspaceId: string;
  accounts: AccountOption[];
  categories: CategoryOption[];
  clients?: LinkOption[];
  projects?: LinkOption[];
  defaultProjectId?: string;
  ocrReceipts?: boolean;
  aiCategory?: boolean;
}) {
  const tForm = useTranslations("forms.transaction");
  const tShared = useTranslations("forms.shared");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const tAi = useTranslations("forms.transactionAi");
  const [state, formAction, isPending] = useActionState(createTransactionAction, initialState);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [transactionDate, setTransactionDate] = useState(todayIsoDate());
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [scanHint, setScanHint] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const comboboxClients = useMemo(
    () => clients.map((c) => ({ _id: c.id, name: c.name, phone: c.phone })),
    [clients],
  );

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.kind === type),
    [categories, type],
  );

  useEffect(() => {
    if (!categoryId && filteredCategories.length > 0) {
      setCategoryId(filteredCategories[0]!.id);
    }
  }, [filteredCategories, categoryId]);

  useEffect(() => {
    if (!isPending && state.error === null) {
      formRef.current?.reset();
      setAmount("");
      setTransactionDate(todayIsoDate());
      setDescription("");
      setCategoryId(filteredCategories[0]?.id ?? "");
      setAttachmentUrl("");
      setAttachmentName("");
      setScanHint(null);
      setSelectedClientId("");
    }
  }, [isPending, state.error, filteredCategories]);

  async function handleReceiptChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setScanHint(null);
    setUploadError(null);
    try {
      const body = new FormData();
      body.append("workspaceId", workspaceId);
      body.append("file", file);
      if (ocrReceipts) body.append("scan", "1");

      const endpoint = ocrReceipts ? "/api/receipts/scan" : "/api/uploads/receipt";
      const res = await fetch(endpoint, { method: "POST", body });
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        throw new Error(tErrors("uploadFailed"));
      }

      const data = (await res.json()) as {
        url?: string;
        error?: string;
        scan?: {
          amount?: number | null;
          transactionDate?: string | null;
          description?: string | null;
          confidence?: number;
        };
        categorySuggestion?: { categoryId: string; confidence: number };
        scanError?: boolean;
      };

      if (!res.ok || !data.url) {
        throw new Error(data.error ?? tErrors("uploadFailed"));
      }

      setAttachmentUrl(data.url);
      setAttachmentName(file.name);

      if (data.scan) {
        if (data.scan.amount != null) setAmount(String(data.scan.amount));
        if (data.scan.transactionDate) setTransactionDate(data.scan.transactionDate);
        if (data.scan.description) setDescription(data.scan.description);
        setType("expense");
        setScanHint(
          tAi("scanApplied", {
            confidence: Math.round(data.scan.confidence ?? 0),
          }),
        );
      } else if (data.scanError) {
        setScanHint(tAi("scanFailed"));
      }

      if (data.categorySuggestion) {
        setCategoryId(data.categorySuggestion.categoryId);
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : tErrors("uploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  async function handleSuggestCategory() {
    if (!aiCategory) return;
    setSuggesting(true);
    setUploadError(null);
    try {
      const res = await fetch("/api/transactions/suggest-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          type,
          description,
        }),
      });
      const data = (await res.json()) as {
        suggestion?: { categoryId: string; confidence: number };
        error?: string;
      };
      if (!res.ok || !data.suggestion) {
        throw new Error(data.error ?? tAi("suggestFailed"));
      }
      setCategoryId(data.suggestion.categoryId);
      setScanHint(tAi("categorySuggested", { confidence: Math.round(data.suggestion.confidence * 100) }));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : tAi("suggestFailed"));
    } finally {
      setSuggesting(false);
    }
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
    >
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="attachmentUrl" value={attachmentUrl} />
      <input type="hidden" name="attachmentName" value={attachmentName} />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType("expense")}
          className={`flex-1 rounded-lg border px-4 py-2 font-medium transition ${
            type === "expense"
              ? "border-red-300 bg-red-50 text-red-700"
              : "border-neutral-200 text-neutral-500"
          }`}
        >
          {tForm("expense")}
        </button>
        <button
          type="button"
          onClick={() => setType("income")}
          className={`flex-1 rounded-lg border px-4 py-2 font-medium transition ${
            type === "income"
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-neutral-200 text-neutral-500"
          }`}
        >
          {tForm("income")}
        </button>
        <input type="hidden" name="type" value={type} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="tx-amount" className="text-sm font-medium text-neutral-700">
            {tForm("amount")}
          </label>
          <input
            id="tx-amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-right focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="tx-date" className="text-sm font-medium text-neutral-700">
            {tForm("date")}
          </label>
          <input
            id="tx-date"
            name="transactionDate"
            type="date"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-right focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="tx-account" className="text-sm font-medium text-neutral-700">
            {tForm("account")}
          </label>
          <select
            id="tx-account"
            name="accountId"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-right focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            required
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="tx-category" className="text-sm font-medium text-neutral-700">
              {tForm("category")}
            </label>
            {aiCategory && (
              <button
                type="button"
                onClick={handleSuggestCategory}
                disabled={suggesting || !description.trim()}
                className="text-xs font-medium text-emerald-700 hover:underline disabled:opacity-50"
              >
                {suggesting ? tAi("suggesting") : tAi("suggestCategory")}
              </button>
            )}
          </div>
          <select
            id="tx-category"
            name="categoryId"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-right focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            required
          >
            {filteredCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon ?? ""} {category.name}
              </option>
            ))}
          </select>
        </div>

        {clients.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="tx-client" className="text-sm font-medium text-neutral-700">
              {tForm("clientOptional")}
            </label>
            <ClientCombobox
              id="tx-client"
              name="clientId"
              clients={comboboxClients}
              value={selectedClientId}
              onChange={setSelectedClientId}
            />
          </div>
        )}

        {projects.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="tx-project" className="text-sm font-medium text-neutral-700">
              {tForm("projectOptional")}
            </label>
            <select
              id="tx-project"
              name="projectId"
              className="rounded-lg border border-neutral-300 px-3 py-2 text-right"
              defaultValue={defaultProjectId ?? ""}
            >
              <option value="">{tShared("none")}</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-sm font-medium text-neutral-700">
            {tForm("receipt")}
            {ocrReceipts && (
              <span className="ms-2 text-xs font-normal text-emerald-700">{tAi("ocrEnabled")}</span>
            )}
          </label>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleReceiptChange} />
          {uploading && <p className="text-xs text-neutral-500">{tShared("uploading")}</p>}
          {attachmentUrl && (
            <p className="text-xs text-emerald-700">
              {tShared("uploaded")} {attachmentName}
            </p>
          )}
          {scanHint && <p className="text-xs text-neutral-500">{scanHint}</p>}
          {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="tx-description" className="text-sm font-medium text-neutral-700">
            {tForm("descriptionOptional")}
          </label>
          <input
            id="tx-description"
            name="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={tForm("descriptionPlaceholder")}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-right focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="tx-notes" className="text-sm font-medium text-neutral-700">
            {tForm("notesOptional")}
          </label>
          <textarea
            id="tx-notes"
            name="notes"
            rows={2}
            placeholder={tForm("notesPlaceholder")}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-right focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </div>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || accounts.length === 0 || filteredCategories.length === 0}
        className="self-start rounded-lg bg-emerald-700 px-5 py-2.5 font-medium text-white transition hover:bg-emerald-800 disabled:opacity-60"
      >
        {isPending ? tCommon("saving") : tForm("submit")}
      </button>

      {accounts.length === 0 && (
        <p className="text-sm text-amber-600">{tForm("needsAccount")}</p>
      )}
    </form>
  );
}
