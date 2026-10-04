import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cookies, headers } from "next/headers";

export async function POST(request: Request) {
  try {
    await auth.api.signOut({
      headers: await headers(),
    });
  } catch (err) {
    console.warn("[api/auth/sign-out] server sign-out error (will proceed to clear cookies):", err);
  }

  const cookieStore = await cookies();
  cookieStore.delete("better-auth.session_token");
  cookieStore.delete("__Secure-better-auth.session_token");
  cookieStore.delete("better-auth.session_data");
  cookieStore.delete("__Secure-better-auth.session_data");

  const response = NextResponse.json({ success: true });
  response.cookies.delete("better-auth.session_token");
  response.cookies.delete("__Secure-better-auth.session_token");
  return response;
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete("better-auth.session_token");
  cookieStore.delete("__Secure-better-auth.session_token");
  cookieStore.delete("better-auth.session_data");
  cookieStore.delete("__Secure-better-auth.session_data");

  const url = new URL("/login", request.url);
  const response = NextResponse.redirect(url);
  response.cookies.delete("better-auth.session_token");
  response.cookies.delete("__Secure-better-auth.session_token");
  return response;
}
