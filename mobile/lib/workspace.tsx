import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  clearAllCache,
  fetchEntitlements,
  fetchWorkspaces,
  type MobileEntitlements,
  type WorkspaceItem,
  type WorkspaceRole,
} from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { setMobileCacheScope } from "@/lib/cache-scope";

type WorkspaceContextValue = {
  workspaceId: string | null;
  workspace: WorkspaceItem | null;
  workspaces: WorkspaceItem[];
  entitlements: MobileEntitlements | null;
  currency: string;
  role: WorkspaceRole;
  canWrite: boolean;
  isOwner: boolean;
  hasFeature: (feature: string) => boolean;
  showAds: boolean;
  loading: boolean;
  error: string | null;
  setWorkspaceId: (id: string) => void;
  refresh: () => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { data: session } = authClient.useSession();
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [entitlements, setEntitlements] = useState<MobileEntitlements | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const userId = session?.user?.id ?? null;
    if (previousUserIdRef.current && userId !== previousUserIdRef.current) {
      clearAllCache();
    }
    previousUserIdRef.current = userId;
    setMobileCacheScope({
      userId: userId ?? "anon",
      workspaceId: workspaceId ?? "",
    });
  }, [session?.user?.id, workspaceId]);

  const refresh = useCallback(async () => {
    if (!session) {
      setWorkspaces([]);
      setWorkspaceId(null);
      setEntitlements(null);
      setLoading(false);
      hasLoadedRef.current = false;
      return;
    }
    // Only trigger full-screen loading on the very first cold load
    if (!hasLoadedRef.current) {
      setLoading(true);
    }
    setError(null);
    try {
      const [ws, ent] = await Promise.all([fetchWorkspaces(), fetchEntitlements()]);
      setWorkspaces(ws.items);
      setEntitlements(ent);
      setWorkspaceId((current) => {
        if (current && ws.items.some((item) => item.id === current)) return current;
        return ws.activeWorkspaceId ?? ws.items[0]?.id ?? null;
      });
      hasLoadedRef.current = true;
    } catch {
      setError("تعذر تحميل المساحات.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const workspace = useMemo(
    () => workspaces.find((item) => item.id === workspaceId) ?? null,
    [workspaces, workspaceId],
  );

  const role: WorkspaceRole = workspace?.role ?? "owner";
  const canWrite = role !== "viewer";
  const isOwner = role === "owner";

  const hasFeature = useCallback(
    (feature: string): boolean => {
      if (entitlements?.plan === "pro") return true;
      if (entitlements?.flags && typeof entitlements.flags[feature] === "boolean") {
        return entitlements.flags[feature];
      }
      return false;
    },
    [entitlements],
  );

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspaceId,
      workspace,
      workspaces,
      entitlements,
      currency: workspace?.currency ?? "EGP",
      role,
      canWrite,
      isOwner,
      hasFeature,
      showAds: entitlements?.showAds ?? false,
      loading,
      error,
      setWorkspaceId,
      refresh,
    }),
    [
      workspaceId,
      workspace,
      workspaces,
      entitlements,
      role,
      canWrite,
      isOwner,
      hasFeature,
      loading,
      error,
      refresh,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
