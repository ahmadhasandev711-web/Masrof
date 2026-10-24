export const LOCALES = ["ar", "en"] as const;

export type AppLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "ar";

export const LOCALE_COOKIE = "masrofaty_locale";

export function isAppLocale(value: string): value is AppLocale {
  return (LOCALES as readonly string[]).includes(value);
}

export function getDirection(locale: AppLocale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function getIntlLocale(locale: AppLocale): string {
  return locale === "en" ? "en-US" : "ar-EG-u-nu-latn";
}

export function resolveLocaleFromHeader(acceptLanguage?: string | null): AppLocale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const normalized = acceptLanguage.toLowerCase();
  const primary = normalized.split(",")[0]?.trim() ?? "";
  if (primary.startsWith("en")) {
    return "en";
  }
  if (primary.startsWith("ar")) {
    return "ar";
  }
  const hasAr = normalized.includes("ar");
  const hasEn = normalized.includes("en");
  if (hasEn && !hasAr) return "en";
  if (hasAr && !hasEn) return "ar";
  if (hasEn && hasAr) {
    return normalized.indexOf("en") < normalized.indexOf("ar") ? "en" : "ar";
  }
  return DEFAULT_LOCALE;
}
