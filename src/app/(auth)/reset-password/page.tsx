import { Suspense } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

type SearchParams = Promise<Record<string, string | undefined>>;

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const t = await getTranslations("auth");
  const token = params.token ?? null;
  const error = params.error;

  return (
    <Card className="w-full max-w-sm border-[#E4DFD3] dark:border-[#26302C]">
      <CardTitle>{t("reset.title")}</CardTitle>
      <CardDescription className="mb-6">{t("reset.description")}</CardDescription>

      {error === "INVALID_TOKEN" ? (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">
          {t("reset.invalidToken")}{" "}
          <Link href="/forgot-password" className="font-medium text-emerald-700 dark:text-[#34D399]">
            {t("reset.requestNewLink")}
          </Link>
        </p>
      ) : null}

      <Suspense fallback={<p className="text-sm text-neutral-400 dark:text-[#66706B]">{t("loading")}</p>}>
        <ResetPasswordForm token={token} />
      </Suspense>
    </Card>
  );
}
