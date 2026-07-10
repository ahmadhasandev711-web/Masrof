"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Field, Input, Label } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const { error: authError } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${appUrl}/reset-password`,
    });

    setIsSubmitting(false);

    if (authError) {
      setError(authError.message ?? t("errors.resetSendFailed"));
      return;
    }

    setMessage(t("forgot.resetMessage"));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field>
        <Label htmlFor="email">{t("fields.email")}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </Field>

      {error && <Alert>{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
        {isSubmitting ? t("submit.sending") : t("submit.sendReset")}
      </Button>

      <p className="text-center text-sm text-neutral-500">
        <Link href="/login" className="font-medium text-emerald-700">
          {t("forgot.backToLogin")}
        </Link>
      </p>
    </form>
  );
}
