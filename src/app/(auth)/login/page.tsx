import Link from "next/link";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/features/auth/components/login-form";
import { isGoogleAuthEnabled } from "@/lib/auth";
import { withRedirectQuery } from "@/features/auth/redirect";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const googleAuthEnabled = isGoogleAuthEnabled();
  const t = await getTranslations("auth");
  const { redirectTo } = await searchParams;
  const registerHref = withRedirectQuery("/register", redirectTo);

  return (
    <div className="w-full max-w-sm rounded-2xl border border-[#E4DFD3] bg-white p-8 shadow-sm">
      <h1 className="mb-1 text-xl font-semibold text-neutral-900">{t("loginTitle")}</h1>
      <p className="mb-6 text-sm text-neutral-500">{t("loginSubtitle")}</p>

      <Suspense fallback={<p className="text-sm text-neutral-400">{t("loading")}</p>}>
        <LoginForm googleAuthEnabled={googleAuthEnabled} />
      </Suspense>

      <p className="mt-4 text-center text-sm">
        <Link href="/forgot-password" className="text-emerald-700 hover:underline">
          {t("forgotPassword")}
        </Link>
      </p>

      <p className="mt-6 text-center text-sm text-neutral-500">
        {t("noAccount")}{" "}
        <Link href={registerHref} className="font-medium text-emerald-700">
          {t("registerLink")}
        </Link>
      </p>
    </div>
  );
}
