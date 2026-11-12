"use server";

import { cookies, headers } from "next/headers";
import { auth } from "@/lib/auth";

const SESSION_COOKIE_OPTIONS = {
  path: "/",
  httpOnly: true,
  sameSite: "lax" as const,
  maxAge: 0,
};

export type SignOutResult = { ok: true };

export async function signOutAction(): Promise<SignOutResult> {
  try {
    const headerStore = await headers();
    await auth.api.signOut({
      headers: headerStore,
    });
  } catch (err) {
    console.warn("[signOutAction] sign-out error (will proceed to clear cookies):", err);
  }

  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    cookieStore.set("__Secure-better-auth.session_token", "", {
      ...SESSION_COOKIE_OPTIONS,
      secure: true,
    });
  } else {
    cookieStore.set("better-auth.session_token", "", {
      ...SESSION_COOKIE_OPTIONS,
      secure: false,
    });
  }

  // Do not call next/navigation redirect — Hostinger reverse proxy breaks
  // Next's internal redirect fetch. Client navigates with window.location.
  return { ok: true };
}
