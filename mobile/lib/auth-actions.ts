import { clearAllCache } from "@/lib/api";
import { setMobileCacheScope } from "@/lib/cache-scope";
import { authClient } from "@/lib/auth-client";

export async function signOutAndClearCache(): Promise<void> {
  clearAllCache();
  setMobileCacheScope({ userId: "anon", workspaceId: "" });
  await authClient.signOut();
}
