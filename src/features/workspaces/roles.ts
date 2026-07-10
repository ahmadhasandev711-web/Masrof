import type { WorkspaceRole } from "@/models/workspace-membership";

export function isWorkspaceOwner(role: WorkspaceRole): boolean {
  return role === "owner";
}

export function canWorkspaceWrite(role: WorkspaceRole): boolean {
  return role !== "viewer";
}
