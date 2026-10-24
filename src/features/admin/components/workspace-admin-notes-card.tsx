"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  updateAdminWorkspaceNotesAction,
  adminExportWorkspaceDataAction,
} from "@/features/admin/actions/workspace-admin-controls";

export function WorkspaceAdminNotesCard({
  workspaceId,
  initialNotes,
  workspaceName,
}: {
  workspaceId: string;
  initialNotes: string;
  workspaceName: string;
}) {
  const t = useTranslations("admin.workspaces");
  const [notes, setNotes] = useState(initialNotes);
  const [isSaved, setIsSaved] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSaveNotes(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateAdminWorkspaceNotesAction(workspaceId, notes);
      if (res.error) {
        window.alert(res.error);
      } else {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      }
    });
  }

  async function handleExportData() {
    setIsExporting(true);
    try {
      const res = await adminExportWorkspaceDataAction(workspaceId);
      if (res.error || !res.json) {
        window.alert(res.error || "فشل تصدير البيانات");
        return;
      }

      // Trigger browser download
      const blob = new Blob([res.json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `workspace-${workspaceName}-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.alert("حدث خطأ أثناء تحميل النسخة");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs flex flex-col gap-4">
      <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
        <div>
          <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <span>📝</span>
            <span>{t("adminNotesTitle")}</span>
          </h3>
          <p className="text-[11px] text-neutral-500 mt-0.5">{t("adminNotesHint")}</p>
        </div>

        {/* Data Export Button */}
        <button
          type="button"
          disabled={isExporting}
          onClick={handleExportData}
          className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 shadow-2xs transition disabled:opacity-50"
          title="تصدير نسخة احتياطية كاملة لبيانات هذه المساحة"
        >
          {isExporting ? t("exporting") : ` ${t("exportBackup")}`}
        </button>
      </div>

      <form onSubmit={handleSaveNotes} className="flex flex-col gap-3">
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setIsSaved(false);
          }}
          placeholder={t("adminNotesPlaceholder")}
          className="w-full rounded-xl border border-neutral-300 p-3 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-hidden focus:border-neutral-500"
        />

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-neutral-400">
            {isSaved ? (
              <span className="text-emerald-700 font-bold"> {t("notesSaved")}</span>
            ) : (
              `${notes.length} / 2000 حرف`
            )}
          </span>

          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-neutral-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-neutral-800 shadow-2xs transition disabled:opacity-50"
          >
            {isPending ? "جارِ الحفظ..." : t("saveNotes")}
          </button>
        </div>
      </form>
    </div>
  );
}
