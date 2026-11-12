import "server-only";

/**
 * Compatibility barrel. Prefer `@/features/dashboard/dashboard.repository` for reads.
 */
import { cache } from "react";
import { dashboardRepository } from "@/features/dashboard/dashboard.repository";

/** Dashboard home stats — cached per request for layout + page reuse. */
export const getDashboardOverview = cache(async (workspaceId: string) =>
  dashboardRepository.getOverview(workspaceId),
);
