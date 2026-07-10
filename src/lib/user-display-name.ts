/**
 * Repairs display names corrupted by broken UTF-8 (e.g. PowerShell sign-up → "???").
 */
export function sanitizeDisplayName(
  name: string | null | undefined,
  fallback = "—",
): string {
  const trimmed = name?.trim();
  if (!trimmed) return fallback;
  if (!/[\p{L}\p{N}]/u.test(trimmed)) return fallback;
  return trimmed;
}
