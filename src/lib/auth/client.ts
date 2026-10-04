import { createAuthClient } from "better-auth/react";
import { phoneNumberClient } from "better-auth/client/plugins";

/**
 * Client-side auth client. Use this inside "use client" components only
 * (login/register forms, "sign out" buttons, session hooks like
 * `authClient.useSession()`).
 *
 * Server Components / Server Actions should import `auth` from
 * "@/lib/auth" instead and call `auth.api.getSession(...)` directly.
 */
export const authClient = createAuthClient({
  // Same origin as the page — never point the browser at Hostinger while
  // the app is served from Vercel (or a preview URL).
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  plugins: [phoneNumberClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
