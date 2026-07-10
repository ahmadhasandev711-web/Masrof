export function safeRedirectPath(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }
  return value;
}

export function withRedirectQuery(path: string, redirectTo: string | null | undefined): string {
  const safe = safeRedirectPath(redirectTo, "");
  if (!safe) return path;
  const url = new URL(path, "http://local");
  url.searchParams.set("redirectTo", safe);
  return `${url.pathname}${url.search}`;
}
