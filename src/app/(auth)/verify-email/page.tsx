import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ResendVerificationForm } from "@/features/auth/components/resend-verification-form";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default async function VerifyEmailPage() {
  const t = await getTranslations("auth");

  return (
    <Card className="w-full max-w-sm border-[#E4DFD3]">
      <CardTitle>{t("verify.title")}</CardTitle>
      <CardDescription className="mb-6">{t("verify.description")}</CardDescription>
      <ResendVerificationForm />
      <p className="mt-6 text-center text-sm text-neutral-500">
        <Link href="/login" className="font-medium text-emerald-700">
          {t("forgot.backToLogin")}
        </Link>
      </p>
    </Card>
  );
}
