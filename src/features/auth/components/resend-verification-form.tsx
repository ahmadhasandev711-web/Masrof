"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Field, Input, Label } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

export function ResendVerificationForm({
  defaultEmail = "",
  showDevEmailHint = false,
}: {
  defaultEmail?: string;
  showDevEmailHint?: boolean;
}) {
  const t = useTranslations("auth");
  const [email, setEmail] = useState(defaultEmail);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const { error: authError } = await authClient.sendVerificationEmail({
      email,
      callbackURL: `${appUrl}/login?verified=1`,
    });

    setIsSubmitting(false);

    if (authError) {
      setError(authError.message ?? t("errors.verificationSendFailed"));
      return;
    }

    setMessage(
      showDevEmailHint
        ? `${t("verify.resendMessage")} ${t("verify.resendMessageDevHint")}`
        : t("verify.resendMessage"),
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field>
        <Label htmlFor="verify-email">{t("fields.email")}</Label>
        <Input
          id="verify-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </Field>

      {error && <Alert>{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? t("submit.sending") : t("submit.resendVerification")}
      </Button>
    </form>
  );
}
