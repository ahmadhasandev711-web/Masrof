import "server-only";

import { redirect } from "next/navigation";
import { env } from "@/lib/env";

/**
 * Hostinger (and similar reverse proxies) listen on 0.0.0.0:3000 behind HTTPS.
 * Relative `redirect("/path")` makes Next fetch that origin with the wrong
 * protocol/host → "failed to get redirect response / fetch failed".
 * Absolute URLs against the public site origin avoid that internal fetch bug.
 */
export function absoluteAppUrl(path: string): string {
  const base = env.BETTER_AUTH_URL.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function hostSafeRedirect(path: string): never {
  redirect(absoluteAppUrl(path));
}
