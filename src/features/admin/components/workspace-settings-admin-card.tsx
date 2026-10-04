"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  updateAdminWorkspaceInfoAction,
  toggleAdminWorkspaceArchiveAction,
  deleteAdminWorkspaceAction,
} from "@/features/admin/actions/workspace-admin-controls";
import { SUPPORTED_CURRENCIES } from "@/lib/currency/constants";
import { WORKSPACE_TYPES } from "@/features/workspaces/constants";

type Props = {
  workspace: {
    id: string;
    name: string;
    type: string;
    currency: string;
    businessPhone?: string;
    isArchived: boolean;
  };
};

export function WorkspaceSettingsAdminCard({ workspace }: Props) {
  const t = useTranslations("admin.workspaces");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(workspace.name);
  const [type, setType] = useState(workspace.type);
  const [currency, setCurrency] = useState(workspace.currency);
  const [phone, setPhone] = useState(workspace.businessPhone ?? "");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteInputName, setDeleteInputName] = useState("");

  function handleSaveInfo(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateAdminWorkspaceInfoAction(workspace.id, {
        name,
        type,
        currency,
        businessPhone: phone,
      });
      if (res.error) {
        window.alert(res.error);
      } else {
        window.alert(t("saveSuccess"));
      }
    });
  }

  function handleToggleArchive() {
    if (window.confirm(workspace.isArchived ? t("confirmUnarchive") : t("confirmArchive"))) {
      startTransition(async () => {
        const res = await toggleAdminWorkspaceArchiveAction(workspace.id);
        if (res.error) {
          window.alert(res.error);
        }
      });
    }
  }

  function handleDeleteWorkspace() {
    startTransition(async () => {
      const res = await deleteAdminWorkspaceAction(workspace.id, deleteInputName);
      if (res.error) {
        window.alert(res.error);
      } else {
        router.push("/admin/workspaces");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs flex flex-col gap-5">
      <div>
        <h2 className="text-sm font-bold text-neutral-900">{t("settingsTitle")}</h2>
        <p className="mt-1 text-xs text-neutral-500">{t("settingsSubtitle")}</p>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSaveInfo} className="grid gap-3 sm:grid-cols-2 text-xs">
        <div className="flex flex-col gap-1">
          <label className="font-semibold text-neutral-700">{t("workspaceName")}:</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-900 shadow-xs focus:border-violet-500 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-semibold text-neutral-700">{t("workspaceType")}:</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-900 shadow-xs focus:border-violet-500 focus:outline-hidden"
          >
            {WORKSPACE_TYPES.map((wType) => (
              <option key={wType} value={wType}>
                {wType === "business"
                  ? t("typeBusiness")
                  : wType === "freelance"
                    ? t("typeFreelance")
                    : t("typePersonal")}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-semibold text-neutral-700">{t("currency")}:</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-900 shadow-xs focus:border-violet-500 focus:outline-hidden"
          >
            {SUPPORTED_CURRENCIES.map((curr) => (
              <option key={curr} value={curr}>
                {curr}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-semibold text-neutral-700">{t("businessPhone")}:</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+201..."
            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-900 shadow-xs focus:border-violet-500 focus:outline-hidden"
            dir="ltr"
          />
        </div>

        <div className="sm:col-span-2 pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-neutral-800 disabled:opacity-50 transition"
          >
            {isPending ? t("saving") : t("saveChanges")}
          </button>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-3.5 flex flex-col gap-3">
        <p className="text-xs font-bold text-rose-900">{t("dangerZone")}</p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={handleToggleArchive}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50 transition"
          >
            {workspace.isArchived ? t("unarchiveWorkspace") : t("archiveWorkspace")}
          </button>

          {!deleteConfirmOpen ? (
            <button
              type="button"
              disabled={isPending}
              onClick={() => setDeleteConfirmOpen(true)}
              className="rounded-lg border border-rose-300 bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-200 disabled:opacity-50 transition"
            >
              {t("deleteWorkspace")}
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2 w-full pt-2 border-t border-rose-200">
              <span className="text-xs text-rose-800">
                {t("typeNameToDelete", { name: workspace.name })}:
              </span>
              <input
                type="text"
                value={deleteInputName}
                onChange={(e) => setDeleteInputName(e.target.value)}
                placeholder={workspace.name}
                className="rounded-md border border-rose-300 bg-white px-2 py-1 text-xs text-neutral-900 focus:outline-hidden"
              />
              <button
                type="button"
                disabled={isPending || deleteInputName.trim() !== workspace.name.trim()}
                onClick={handleDeleteWorkspace}
                className="rounded-md bg-rose-600 px-3 py-1 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-40 transition"
              >
                {t("confirmDeletePermanently")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setDeleteInputName("");
                }}
                className="rounded-md border border-neutral-300 bg-white px-2.5 py-1 text-xs text-neutral-600 hover:bg-neutral-100"
              >
                {t("cancel")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
