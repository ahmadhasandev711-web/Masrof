import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  fetchEntitlements,
  fetchWorkspaces,
  type MobileEntitlements,
  type WorkspaceItem,
} from "@/lib/api";
import { authClient } from "@/lib/auth-client";

type WorkspaceContextValue = {
  workspaceId: string | null;
  workspace: WorkspaceItem | null;
  workspaces: WorkspaceItem[];
  entitlements: MobileEntitlements | null;
  currency: string;
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

  const refresh = useCallback(async () => {
    if (!session) {
      setWorkspaces([]);
      setWorkspaceId(null);
      setEntitlements(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [ws, ent] = await Promise.all([fetchWorkspaces(), fetchEntitlements()]);
      setWorkspaces(ws.items);
      setEntitlements(ent);
      setWorkspaceId((current) => {
        if (current && ws.items.some((item) => item.id === current)) return current;
        return ws.activeWorkspaceId ?? ws.items[0]?.id ?? null;
      });
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

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspaceId,
      workspace,
      workspaces,
      entitlements,
      currency: workspace?.currency ?? "EGP",
      showAds: entitlements?.showAds ?? true,
      loading,
      error,
      setWorkspaceId,
      refresh,
    }),
    [workspaceId, workspace, workspaces, entitlements, loading, error, refresh],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
