"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/features/auth/session";
import { verifyWorkspaceAccess } from "@/features/workspaces/access";
import { setActiveWorkspaceId } from "@/features/workspaces/active-workspace";

export async function switchWorkspaceAction(workspaceId: string): Promise<void> {
  const session = await requireSession();

  // Confirms the user actually belongs to this workspace before switching —
  // never trust the workspaceId a client-side switcher button passes in.
  await verifyWorkspaceAccess(session.user.id, workspaceId);

  await setActiveWorkspaceId(workspaceId);
  revalidatePath("/dashboard");
}
