import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/mongoose", () => ({ connectToDatabase: vi.fn(async () => undefined) }));

const findSubscription = vi.fn();
vi.mock("@/models/user-subscription", () => ({
  UserSubscriptionModel: { findOne: (...args: unknown[]) => findSubscription(...args) },
}));

const ownedWorkspaceCount = vi.fn(async () => 0);
vi.mock("@/features/workspaces/members-data", () => ({
  countOwnedWorkspacesForUser: () => ownedWorkspaceCount(),
}));

vi.mock("@/features/subscriptions/plan-config-data", () => ({
  getPlanConfig: async () => ({ maxWorkspaces: 1 }),
  getPlanQuantityLimit: async () => 0,
  planAllowsQuantity: async () => true,
  planAllowsWorkspaces: async (_plan: string, owned: number) => owned < 1,
  planHasFeature: async () => false,
}));

vi.mock("@/features/workspaces/current", () => ({ getCurrentWorkspaceContext: async () => null }));
vi.mock("@/i18n/plans-localized", () => ({
  getLocalizedPlan: async () => ({ name: "Free" }),
  getLocalizedPlanFeatureMessage: async () => "feature locked",
  getLocalizedQuantityLimitMessage: async () => "quantity limit",
}));
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));

const { getUserSubscription, assertCanCreateWorkspace, assertUserNotSuspended, SubscriptionSuspendedError } =
  await import("@/features/subscriptions/data");

/** `getUserSubscription` is memoized with React `cache`, so every test uses a fresh user id. */
let idCounter = 0;
function nextUserId() {
  idCounter += 1;
  return `user-${idCounter}`;
}

function mockSubscription(record: Record<string, unknown> | null) {
  findSubscription.mockReturnValue({ lean: async () => record });
  return nextUserId();
}

beforeEach(() => {
  findSubscription.mockReset();
  ownedWorkspaceCount.mockResolvedValue(0);
});

describe("effective plan resolution", () => {
  it("treats a user with no subscription record as free", async () => {
    const userId = mockSubscription(null);

    await expect(getUserSubscription(userId)).resolves.toMatchObject({ plan: "free" });
  });

  it("downgrades an expired paid plan to free", async () => {
    const userId = mockSubscription({
      plan: "pro",
      status: "active",
      expiresAt: new Date(Date.now() - 1_000),
    });

    await expect(getUserSubscription(userId)).resolves.toMatchObject({ plan: "free" });
  });

  it("keeps an unexpired paid plan", async () => {
    const userId = mockSubscription({
      plan: "pro",
      status: "active",
      expiresAt: new Date(Date.now() + 86_400_000),
    });

    await expect(getUserSubscription(userId)).resolves.toMatchObject({ plan: "pro" });
  });

  it("downgrades cancelled and suspended subscriptions", async () => {
    const cancelled = mockSubscription({ plan: "pro", status: "cancelled", expiresAt: null });
    await expect(getUserSubscription(cancelled)).resolves.toMatchObject({ plan: "free" });

    const suspended = mockSubscription({ plan: "pro", status: "suspended", expiresAt: null });
    await expect(getUserSubscription(suspended)).resolves.toMatchObject({
      plan: "free",
      isSuspended: true,
    });
  });

  it("falls back to free when the database is unreachable", async () => {
    findSubscription.mockReturnValue({
      lean: async () => {
        throw new Error("no connection");
      },
    });

    await expect(getUserSubscription(nextUserId())).resolves.toMatchObject({ plan: "free" });
  });
});

describe("workspace creation gate", () => {
  it("allows a free user under the workspace limit", async () => {
    const userId = mockSubscription(null);
    ownedWorkspaceCount.mockResolvedValue(0);

    await expect(assertCanCreateWorkspace(userId)).resolves.toBeNull();
  });

  it("blocks a free user who already owns their allowance", async () => {
    const userId = mockSubscription(null);
    ownedWorkspaceCount.mockResolvedValue(1);

    await expect(assertCanCreateWorkspace(userId)).resolves.toEqual(expect.any(String));
  });

  it("blocks a suspended account before any limit check", async () => {
    const userId = mockSubscription({ plan: "pro", status: "suspended", expiresAt: null });

    await expect(assertUserNotSuspended(userId)).rejects.toBeInstanceOf(SubscriptionSuspendedError);
  });
});
