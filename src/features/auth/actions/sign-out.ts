"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

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
  cookieStore.delete("better-auth.session_token");
  cookieStore.delete("__Secure-better-auth.session_token");
  cookieStore.delete("better-auth.session_data");
  cookieStore.delete("__Secure-better-auth.session_data");

  redirect("/login");
}
