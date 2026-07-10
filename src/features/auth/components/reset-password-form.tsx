"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Field, Input, Label } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

export function ResetPasswordForm({ token }: { token: string | null }) {
  const router = useRouter();
  const t = useTranslations("auth");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!token) {
    return (
      <Alert>
        {t("reset.invalidLink")}{" "}
        <Link href="/forgot-password" className="font-medium text-emerald-700">
          {t("reset.requestNewLink")}
        </Link>
      </Alert>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error: authError } = await authClient.resetPassword({
      newPassword: password,
      token: token!,
    });

    setIsSubmitting(false);

    if (authError) {
      setError(authError.message ?? t("errors.resetFailed"));
      return;
    }

    router.push("/login?reset=success");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field>
        <Label htmlFor="password">{t("fields.newPassword")}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </Field>

      {error && <Alert>{error}</Alert>}

      <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
        {isSubmitting ? t("loading") : t("submit.savePassword")}
      </Button>
    </form>
  );
}
