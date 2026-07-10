import type { AppLocale } from "@/i18n/config";

const catalogs: Record<AppLocale, () => Promise<Record<string, unknown>>> = {
  ar: () => import("./ar").then((m) => m.default),
  en: () => import("./en").then((m) => m.default),
};

export async function loadMessages(locale: AppLocale) {
  return catalogs[locale]();
}
