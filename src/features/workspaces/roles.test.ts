import { describe, expect, it } from "vitest";
import { canWorkspaceWrite, isWorkspaceOwner } from "@/features/workspaces/roles";

describe("workspace roles", () => {
  it("blocks viewer write access", () => {
    expect(canWorkspaceWrite("viewer")).toBe(false);
  });

  it("allows owner and member write access", () => {
    expect(canWorkspaceWrite("owner")).toBe(true);
    expect(canWorkspaceWrite("member")).toBe(true);
  });

  it("detects owner role", () => {
    expect(isWorkspaceOwner("owner")).toBe(true);
    expect(isWorkspaceOwner("member")).toBe(false);
  });
});
