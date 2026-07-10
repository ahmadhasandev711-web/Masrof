"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { exportWorkspaceBackupAction } from "@/features/backup/actions/export-backup";
import {
  restoreWorkspaceBackupAction,
  type RestoreWorkspaceBackupState,
} from "@/features/backup/actions/restore-backup";
import { useTranslations } from "next-intl";

const restoreInitialState: RestoreWorkspaceBackupState = {
  error: null,
  success: false,
  workspaceId: null,
};

export function BackupPanel({
  workspaceId,
  workspaceName,
  canUseBackup,
}: {
  workspaceId: string;
  workspaceName: string;
  canUseBackup: boolean;
}) {
  const tForm = useTranslations("forms.backup");
  const tDashboard = useTranslations("dashboard.backup");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("errors");
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [backupJson, setBackupJson] = useState("");
  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const [isExporting, startExport] = useTransition();
  const [restoreState, restoreAction, isRestoring] = useActionState(
    restoreWorkspaceBackupAction,
    restoreInitialState,
  );

  function handleExport() {
    if (!canUseBackup) return;
    setExportError(null);
    startExport(async () => {
      const result = await exportWorkspaceBackupAction(workspaceId);
      if ("error" in result) {
        setExportError(result.error);
        return;
      }

      const blob = new Blob([result.json], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = result.filename;
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setBackupJson("");
      setFileLabel(null);
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      setExportError(tErrors("backupTooLarge"));
      setBackupJson("");
      setFileLabel(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setBackupJson(String(reader.result ?? ""));
      setFileLabel(file.name);
      setExportError(null);
    };
    reader.onerror = () => {
      setExportError(tErrors("backupReadFailed"));
      setBackupJson("");
      setFileLabel(null);
    };
    reader.readAsText(file);
  }

  useEffect(() => {
    if (restoreState.success && restoreState.workspaceId) {
      router.refresh();
    }
  }, [restoreState.success, restoreState.workspaceId, router]);

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-800">{tDashboard("exportTitle")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          {tDashboard("exportDescription")}
        </p>
        <button
          type="button"
          onClick={handleExport}
          disabled={!canUseBackup || isExporting}
          className="mt-4 rounded-lg bg-[#065F46] px-4 py-2 text-sm font-medium text-white hover:bg-[#054d3a] disabled:opacity-60"
        >
          {isExporting ? tCommon("exporting") : tDashboard("exportButton")}
        </button>
        {exportError && <p className="mt-2 text-sm text-red-600">{exportError}</p>}
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50/40 p-6">
        <h2 className="text-sm font-semibold text-amber-900">{tDashboard("restoreTitle")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-amber-900/80">
          {tDashboard("restoreDescription")}
        </p>

        <form action={restoreAction} className="mt-4 flex flex-col gap-4">
          <input type="hidden" name="backupJson" value={backupJson} />

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-neutral-700">{tForm("file")}</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              disabled={!canUseBackup || isRestoring}
              onChange={handleFileChange}
              className="text-sm"
            />
            {fileLabel && (
              <p className="text-xs text-neutral-500">
                {tDashboard("restoreFileSelected")} {fileLabel}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="restore-workspace-name" className="text-sm font-medium text-neutral-700">
              {tForm("workspaceName")}
            </label>
            <input
              id="restore-workspace-name"
              name="workspaceName"
              type="text"
              placeholder={tDashboard("restoreWorkspacePlaceholder", { name: workspaceName })}
              disabled={!canUseBackup || isRestoring}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="restore-confirmation" className="text-sm font-medium text-neutral-700">
              {tForm("confirmation")}
            </label>
            <input
              id="restore-confirmation"
              name="confirmation"
              type="text"
              disabled={!canUseBackup || isRestoring}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={!canUseBackup || isRestoring || !backupJson}
            className="self-start rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-60"
          >
            {isRestoring ? tDashboard("restoring") : tDashboard("restoreButton")}
          </button>

          {restoreState.error && <p className="text-sm text-red-600">{restoreState.error}</p>}
          {restoreState.success && (
            <p className="text-sm text-emerald-700">
              {tDashboard("restoreSuccess")}
            </p>
          )}
        </form>
      </section>
    </div>
  );
}
