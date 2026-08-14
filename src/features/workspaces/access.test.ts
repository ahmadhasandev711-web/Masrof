import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db/mongoose", () => ({ connectToDatabase: vi.fn(async () => undefined) }));

const findMembership = vi.fn();
const findWorkspace = vi.fn();

vi.mock("@/models/workspace-membership", () => ({
  WorkspaceMembershipModel: { findOne: (...args: unknown[]) => findMembership(...args) },
  INVITABLE_WORKSPACE_ROLES: ["member", "viewer"],
}));

vi.mock("@/models/workspace", () => ({
  WorkspaceModel: { findOne: (...args: unknown[]) => findWorkspace(...args) },
}));

const {
  verifyWorkspaceAccess,
  verifyWorkspaceWriteAccess,
  requireWorkspaceOwner,
  WorkspaceAccessDeniedError,
  WorkspaceOwnerRequiredError,
  WorkspaceWriteDeniedError,
} = await import("@/features/workspaces/access");

function lean<T>(value: T) {
  return { lean: async () => value };
}

/** `loadWorkspaceAccess` is memoized with React `cache`, so every test uses a fresh id. */
let idCounter = 0;
function nextWorkspaceId() {
  idCounter += 1;
  return `workspace-${idCounter}`;
}

function mockAccess(role: string | null, workspaceFound = true) {
  const workspaceId = nextWorkspaceId();
  findMembership.mockReturnValue(lean(role ? { role, userId: "user-1" } : null));
  findWorkspace.mockReturnValue(lean(workspaceFound ? { _id: workspaceId, name: "W" } : null));
  return workspaceId;
}

describe("workspace access gate", () => {
  beforeEach(() => {
    findMembership.mockReset();
    findWorkspace.mockReset();
  });

  it("denies a user with no membership, without ever looking at the workspace", async () => {
    const workspaceId = mockAccess(null);

    await expect(verifyWorkspaceAccess("user-1", workspaceId)).rejects.toBeInstanceOf(
      WorkspaceAccessDeniedError,
    );
    expect(findWorkspace).not.toHaveBeenCalled();
  });

  it("denies access to an archived workspace even for a member", async () => {
    const workspaceId = mockAccess("owner", false);

    await expect(verifyWorkspaceAccess("user-1", workspaceId)).rejects.toBeInstanceOf(
      WorkspaceAccessDeniedError,
    );
    expect(findWorkspace).toHaveBeenCalledWith({ _id: workspaceId, isArchived: false });
  });

  it("scopes the membership lookup to the requesting user", async () => {
    const workspaceId = mockAccess("member");

    await verifyWorkspaceAccess("user-1", workspaceId);

    expect(findMembership).toHaveBeenCalledWith({ workspaceId, userId: "user-1" });
  });

  it("lets members write but blocks viewers", async () => {
    const memberWorkspace = mockAccess("member");
    await expect(verifyWorkspaceWriteAccess("user-1", memberWorkspace)).resolves.toBeDefined();

    const viewerWorkspace = mockAccess("viewer");
    await expect(
      verifyWorkspaceWriteAccess("user-1", viewerWorkspace),
    ).rejects.toBeInstanceOf(WorkspaceWriteDeniedError);
  });

  it("requires the owner role for owner-only operations", async () => {
    const ownerWorkspace = mockAccess("owner");
    await expect(requireWorkspaceOwner("user-1", ownerWorkspace)).resolves.toBeDefined();

    const memberWorkspace = mockAccess("member");
    await expect(requireWorkspaceOwner("user-1", memberWorkspace)).rejects.toBeInstanceOf(
      WorkspaceOwnerRequiredError,
    );
  });
});
