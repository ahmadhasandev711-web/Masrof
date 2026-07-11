import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { isAuthEmailConfigured } from "@/lib/auth/emails";
import { getTranslations } from "next-intl/server";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth");
  const showDevEmailHint = !isAuthEmailConfigured();

  return (
    <Card className="w-full max-w-sm border-[#E4DFD3]">
      <CardTitle>{t("forgot.title")}</CardTitle>
      <CardDescription className="mb-6">{t("forgot.description")}</CardDescription>
      <ForgotPasswordForm showDevEmailHint={showDevEmailHint} />
    </Card>
  );
}
