import { createAuthClient } from "better-auth/react";

/**
 * Client-side auth client. Use this inside "use client" components only
 * (login/register forms, "sign out" buttons, session hooks like
 * `authClient.useSession()`).
 *
 * Server Components / Server Actions should import `auth` from
 * "@/lib/auth" instead and call `auth.api.getSession(...)` directly.
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
});

export const { signIn, signUp, signOut, useSession } = authClient;
