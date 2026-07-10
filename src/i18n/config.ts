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
  return locale === "en" ? "en-US" : "ar-EG";
}
