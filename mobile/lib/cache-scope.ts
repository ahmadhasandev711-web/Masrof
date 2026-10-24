export type MobileCacheScope = {
  userId: string;
  workspaceId: string;
};

let scope: MobileCacheScope = { userId: "anon", workspaceId: "" };

export function getMobileCacheScope(): MobileCacheScope {
  return scope;
}

export function setMobileCacheScope(partial: Partial<MobileCacheScope>): void {
  scope = { ...scope, ...partial };
}

export function scopedCacheKey(path: string): string {
  const { userId, workspaceId } = scope;
  return `${userId}:${workspaceId}:${path}`;
}
