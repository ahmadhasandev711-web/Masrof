import "server-only";

import { cache } from "react";
import type { Types } from "mongoose";
import { workspacesService } from "@/features/workspaces/workspaces.service";
import {
  getActiveWorkspaceId,
} from "@/features/workspaces/active-workspace";
import type { WorkspaceDocument } from "@/models/workspace";

type ResolvedWorkspace = WorkspaceDocument & { _id: Types.ObjectId };

/**
 * Resolves "the workspace the user is currently working in" for any
 * protected page nested under /dashboard.
 *
 * Cached per request via React `cache()` — layout + page share one DB round-trip.
 */
export const getCurrentWorkspaceContext = cache(async (userId: string) => {
  const workspaces = await workspacesService.listForUser(userId);

  if (workspaces.length === 0) {
    return { workspaces, activeWorkspace: null };
  }

  const requestedActiveId = await getActiveWorkspaceId();
  const activeWorkspace: ResolvedWorkspace =
    workspaces.find((w) => w._id.toString() === requestedActiveId) ?? workspaces[0];

  return { workspaces, activeWorkspace };
});
