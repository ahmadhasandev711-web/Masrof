"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth/client";
import { createLoginSchema } from "@/features/auth/schemas";
import { safeRedirectPath, withRedirectQuery } from "@/features/auth/redirect";
import { Alert } from "@/components/ui/alert";
import { Field, Input, Label } from "@/components/ui/input";
import { AuthDivider, GoogleSignInButton } from "@/features/auth/components/google-sign-in-button";
import { getOAuthErrorMessage } from "@/features/auth/oauth-errors";

export function LoginForm({ googleAuthEnabled = false }: { googleAuthEnabled?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth");
  const tValidation = useTranslations("validation");
  const loginSchema = createLoginSchema(tValidation);
  const redirectTo = safeRedirectPath(searchParams.get("redirectTo"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const verified = searchParams.get("verified") === "1";
  const resetSuccess = searchParams.get("reset") === "success";
  const oauthError = getOAuthErrorMessage(
    searchParams.get("error"),
    (key) => t(`oauth.${key}`),
    searchParams.get("error_description"),
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? tValidation("invalidData"));
      return;
    }

    setIsSubmitting(true);
    const { error: authError } = await authClient.signIn.email({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setIsSubmitting(false);

    if (authError) {
      const rawMessage = authError.message ?? "";
      const isUnknownUser =
        rawMessage.toLowerCase().includes("not found") ||
        rawMessage.toLowerCase().includes("user not found");
      const message = isUnknownUser ? t("errors.userNotFound") : rawMessage || t("errors.invalidCredentials");
      setError(message);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {verified && (
        <Alert variant="success">{t("alerts.verified")}</Alert>
      )}
      {resetSuccess && (
        <Alert variant="success">{t("alerts.resetSuccess")}</Alert>
      )}
      {oauthError && <Alert>{oauthError}</Alert>}

      {googleAuthEnabled && (
        <>
          <GoogleSignInButton callbackURL={redirectTo} disabled={isSubmitting} />
          <AuthDivider />
        </>
      )}

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

      <Field>
        <Label htmlFor="password">{t("fields.password")}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </Field>

      {error && (
        <div className="flex flex-col gap-2">
          <Alert>{error}</Alert>
          {error === t("errors.userNotFound") && (
            <p className="text-sm text-neutral-500">
              <Link href={withRedirectQuery("/register", redirectTo)} className="font-medium text-emerald-700">
                {t("errors.createAccountInstead")}
              </Link>
            </p>
          )}
          {error.toLowerCase().includes("verif") && (
            <p className="text-sm text-neutral-500">
              <Link href="/verify-email" className="font-medium text-emerald-700">
                {t("alerts.verifyEmailLink")}
              </Link>
            </p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 rounded-lg bg-emerald-700 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-800 disabled:opacity-60"
      >
        {isSubmitting ? t("submit.loggingIn") : t("submit.login")}
      </button>
    </form>
  );
}
