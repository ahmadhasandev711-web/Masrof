import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, isAppLocale, LOCALE_COOKIE, resolveLocaleFromHeader, type AppLocale } from "./config";
import { loadMessages } from "./messages/loader";

export default getRequestConfig(async () => {
  const jar = await cookies();
  const cookieLocale = jar.get(LOCALE_COOKIE)?.value;

  let locale: AppLocale;
  if (cookieLocale && isAppLocale(cookieLocale)) {
    locale = cookieLocale;
  } else {
    try {
      const headerList = await headers();
      locale = resolveLocaleFromHeader(headerList.get("accept-language"));
    } catch {
      locale = DEFAULT_LOCALE;
    }
  }

  return {
    locale,
    messages: await loadMessages(locale),
    onError(error) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[i18n]: ${error.message}`);
      }
    },
    getMessageFallback({ namespace, key }) {
      return [namespace, key].filter(Boolean).join(".");
    },
  };
});
