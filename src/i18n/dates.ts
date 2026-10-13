import type { AppLocale } from "./config";

export function getDateLocale(locale: AppLocale): string {
  return locale === "en" ? "en-US" : "ar-EG-u-nu-latn";
}
