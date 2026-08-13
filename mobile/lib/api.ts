import { getAuthCookie } from "@/lib/auth-client";
import { API_URL } from "@/lib/config";

export type MobileEntitlements = {
  user: { id: string; name: string; email: string };
  plan: "free" | "pro" | "plus";
  showAds: boolean;
  isSuspended: boolean;
};

export async function fetchEntitlements(): Promise<MobileEntitlements> {
  const cookies = getAuthCookie();
  const response = await fetch(`${API_URL}/api/mobile/entitlements`, {
    headers: cookies ? { Cookie: cookies } : undefined,
    credentials: "omit",
  });

  if (!response.ok) {
    throw new Error(
      response.status === 404
        ? "missing-entitlements-route"
        : response.status === 401
          ? "unauthorized"
          : "server-error",
    );
  }

  return response.json() as Promise<MobileEntitlements>;
}
