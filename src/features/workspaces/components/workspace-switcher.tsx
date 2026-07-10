"use client";

import { useTransition } from "react";
import { switchWorkspaceAction } from "@/features/workspaces/actions/switch-workspace";
import { useTranslations } from "next-intl";

type WorkspaceOption = {
  id: string;
  name: string;
  type: string;
};

export function WorkspaceSwitcher({
  workspaces,
  activeWorkspaceId,
  className,
}: {
  workspaces: WorkspaceOption[];
  activeWorkspaceId: string;
  className?: string;
}) {
  const tWorkspaceType = useTranslations("workspaceType");
  const [isPending, startTransition] = useTransition();

  function handleChange(workspaceId: string) {
    if (workspaceId === activeWorkspaceId) return;
    startTransition(async () => {
      await switchWorkspaceAction(workspaceId);
      window.location.reload();
    });
  }

  return (
    <select
      value={activeWorkspaceId}
      disabled={isPending}
      onChange={(e) => handleChange(e.target.value)}
      className={`max-w-full truncate rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm font-medium text-neutral-700 disabled:opacity-60 sm:px-3 ${className ?? ""}`}
    >
      {workspaces.map((workspace) => (
        <option key={workspace.id} value={workspace.id}>
          {workspace.name} · {tWorkspaceType(workspace.type)}
        </option>
      ))}
    </select>
  );
}
