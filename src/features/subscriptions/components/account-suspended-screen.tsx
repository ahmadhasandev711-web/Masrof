import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function AccountSuspendedScreen() {
  const t = await getTranslations("auth");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FBF9F4] px-6">
      <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <p className="text-4xl">⛔</p>
        <h1 className="mt-4 text-xl font-semibold text-[#1C1B1A]">{t("suspended.title")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#1C1B1A]/65">{t("suspended.body")}</p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg bg-[#065F46] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#054d3a]"
        >
          {t("suspended.backToLogin")}
        </Link>
      </div>
    </div>
  );
}
