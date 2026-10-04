"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { adminEnterWorkspacePreviewAction } from "@/features/admin/actions/workspace-admin-controls";

export function WorkspacePreviewButton({ workspaceId }: { workspaceId: string }) {
  const t = useTranslations("admin.workspaces");
  const [isPending, startTransition] = useTransition();

  function handlePreview() {
    startTransition(async () => {
      const res = await adminEnterWorkspacePreviewAction(workspaceId);
      if (res.error) {
        window.alert(res.error);
        return;
      }
      window.location.href = "/dashboard";
    });
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handlePreview}
      className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-violet-700 transition disabled:opacity-60"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
      <span>{isPending ? t("previewLoading") : t("previewInDashboard")}</span>
    </button>
  );
}
