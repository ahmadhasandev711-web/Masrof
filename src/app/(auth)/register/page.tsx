import Link from "next/link";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { RegisterForm } from "@/features/auth/components/register-form";
import { emailFeaturesEnabled, isGoogleAuthEnabled } from "@/lib/auth";
import { withRedirectQuery } from "@/features/auth/redirect";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; email?: string }>;
}) {
  const googleAuthEnabled = isGoogleAuthEnabled();
  const t = await getTranslations("auth");
  const { redirectTo, email } = await searchParams;
  const loginHref = withRedirectQuery("/login", redirectTo);

  return (
    <div className="w-full max-w-sm rounded-2xl border border-[#E4DFD3] bg-white p-8 shadow-sm">
      <h1 className="mb-1 text-xl font-semibold text-neutral-900">{t("registerTitle")}</h1>
      <p className="mb-6 text-sm text-neutral-500">{t("registerSubtitle")}</p>

      <Suspense fallback={<p className="text-sm text-neutral-400">{t("loading")}</p>}>
        <RegisterForm
          requiresEmailVerification={emailFeaturesEnabled}
          googleAuthEnabled={googleAuthEnabled}
          defaultEmail={email ?? ""}
        />
      </Suspense>

      <p className="mt-6 text-center text-sm text-neutral-500">
        {t("hasAccount")}{" "}
        <Link href={loginHref} className="font-medium text-emerald-700">
          {t("loginLink")}
        </Link>
      </p>
    </div>
  );
}
