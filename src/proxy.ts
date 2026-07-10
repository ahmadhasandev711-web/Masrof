import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Lightweight route protection.
 *
 * This ONLY checks whether a session cookie exists — it does not hit
 * the database. That's intentional: middleware runs on the Edge for
 * every matched request, so it must stay fast. The real, authoritative
 * session check (via `auth.api.getSession`) still happens inside each
 * protected Server Component / Server Action / Route Handler.
 *
 * Never trust this middleware alone as the security boundary.
 */
export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

  if (!sessionCookie && !isAuthPage) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (sessionCookie && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Protect everything under the authenticated app, plus the auth pages
  // themselves (so a logged-in user can't revisit /login).
  // The public marketing site and blog are intentionally excluded.
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/admin/:path*", "/print/:path*", "/login", "/register"],
};
