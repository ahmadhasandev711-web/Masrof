import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isAppLocale, LOCALE_COOKIE } from "./config";
import { loadMessages } from "./messages/loader";

export default getRequestConfig(async () => {
  const jar = await cookies();
  const cookieLocale = jar.get(LOCALE_COOKIE)?.value;
  const locale = cookieLocale && isAppLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

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
