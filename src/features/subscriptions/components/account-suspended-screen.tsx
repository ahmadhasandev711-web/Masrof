import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function AccountSuspendedScreen() {
  const t = await getTranslations("auth");

  return (
    <div
      data-theme-scope="app"
      className="flex min-h-screen items-center justify-center bg-[#FBF9F4] px-6 dark:bg-[#0E1412]"
    >
      <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm dark:border-red-900/60 dark:bg-[#161E1B]">
        <p className="text-4xl"></p>
        <h1 className="mt-4 text-xl font-semibold text-[#1C1B1A] dark:text-[#ECEAE4]">{t("suspended.title")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#1C1B1A]/65 dark:text-[#9AA39F]">{t("suspended.body")}</p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg bg-[#065F46] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#054d3a] dark:bg-[#10B981] dark:text-[#04231A] dark:hover:bg-[#34D399]"
        >
          {t("suspended.backToLogin")}
        </Link>
      </div>
    </div>
  );
}
