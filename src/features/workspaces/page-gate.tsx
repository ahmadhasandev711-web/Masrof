import { ClientRedirect } from "@/components/client-redirect";
import { getCurrentWorkspaceContext } from "@/features/workspaces/current";
import type { WorkspaceDocument } from "@/models/workspace";
import type { Types } from "mongoose";

type ResolvedWorkspace = WorkspaceDocument & { _id: Types.ObjectId };

export async function getActiveWorkspaceForPage(userId: string): Promise<
  | { activeWorkspace: ResolvedWorkspace; redirect: null }
  | { activeWorkspace: null; redirect: React.ReactElement }
> {
  const { activeWorkspace } = await getCurrentWorkspaceContext(userId);

  if (!activeWorkspace) {
    return { activeWorkspace: null, redirect: <ClientRedirect href="/onboarding" /> };
  }

  return { activeWorkspace, redirect: null };
}
