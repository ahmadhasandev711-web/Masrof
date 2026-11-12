import "server-only";

import {
  assertWorkspacePlanFeature,
  assertWorkspaceQuantityLimit,
} from "@/features/subscriptions/data";
import type { PlanFeature } from "@/features/subscriptions/plans";
import type { PlanQuantityLimitKey } from "@/features/subscriptions/default-plans";
import { PlanFeatureError, PlanLimitError } from "@/server/kernel/errors";
import { err, ok, type Result } from "@/server/kernel/result";

/** Shared plan gates for every domain service — never copy these into actions/routes. */
export async function requirePlanFeature(
  userId: string,
  workspaceId: string,
  feature: PlanFeature,
): Promise<Result<void>> {
  const message = await assertWorkspacePlanFeature(userId, workspaceId, feature);
  if (message) return err(new PlanFeatureError(message));
  return ok(undefined);
}

export async function requireQuantityLimit(
  userId: string,
  workspaceId: string,
  limitKey: PlanQuantityLimitKey,
  currentCount: number,
): Promise<Result<void>> {
  const message = await assertWorkspaceQuantityLimit(
    userId,
    workspaceId,
    limitKey,
    currentCount,
  );
  if (message) return err(new PlanLimitError(message));
  return ok(undefined);
}
