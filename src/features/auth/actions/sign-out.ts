"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

const SESSION_COOKIE_OPTIONS = {
  path: "/",
  httpOnly: true,
  sameSite: "lax" as const,
  maxAge: 0,
};

export async function signOutAction() {
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

  redirect("/login");
}
