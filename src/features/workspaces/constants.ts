export const WORKSPACE_TYPES = ["personal", "freelance", "business"] as const;
export type WorkspaceType = (typeof WORKSPACE_TYPES)[number];
