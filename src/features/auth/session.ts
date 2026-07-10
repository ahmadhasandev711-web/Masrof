import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, type Session } from "@/lib/auth";

/**
 * Reads the current session from better-auth.
 *
 * Wrapped in React's `cache()` so that if multiple Server Components
 * in the same request tree ask "who is logged in?", we only hit the
 * database once per request instead of once per component.
 */
export const getCurrentSession = cache(async (): Promise<Session | null> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
});

/**
 * Use this at the top of any Server Component / Server Action that
 * must never run for an anonymous user. Redirects to /login instead of
 * silently returning null, so callers can assume a non-null session.
 */
export async function requireSession(): Promise<Session> {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}
