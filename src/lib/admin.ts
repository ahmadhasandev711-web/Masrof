import "server-only";

import { env } from "@/lib/env";
import { requireSession } from "@/features/auth/session";
import type { Session } from "@/lib/auth";
import { hostSafeRedirect } from "@/lib/navigation/host-safe-redirect";

export function getAdminEmails(): string[] {
  return (env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string): boolean {
  return getAdminEmails().includes(email.toLowerCase());
}

export async function requireAdmin(): Promise<Session> {
  const session = await requireSession();

  if (!isAdminEmail(session.user.email)) {
    hostSafeRedirect("/dashboard");
  }

  return session;
}
