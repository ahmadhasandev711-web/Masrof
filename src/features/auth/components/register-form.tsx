"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth/client";
import { createRegisterSchema } from "@/features/auth/schemas";
import { safeRedirectPath } from "@/features/auth/redirect";
import { Field, Input, Label } from "@/components/ui/input";
import { AuthDivider, GoogleSignInButton } from "@/features/auth/components/google-sign-in-button";

export function RegisterForm({
  requiresEmailVerification = false,
  googleAuthEnabled = false,
  defaultEmail = "",
}: {
  requiresEmailVerification?: boolean;
  googleAuthEnabled?: boolean;
  defaultEmail?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("auth");
  const tValidation = useTranslations("validation");
  const registerSchema = createRegisterSchema(tValidation);
  const redirectTo = safeRedirectPath(searchParams.get("redirectTo"), "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(defaultEmail || searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const postAuthPath = redirectTo || "/onboarding";
  const callbackURL = requiresEmailVerification
    ? redirectTo
      ? `/verify-email?redirectTo=${encodeURIComponent(redirectTo)}`
      : "/verify-email"
    : postAuthPath;
  const googleCallbackURL = postAuthPath;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = registerSchema.safeParse({ name, email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? tValidation("invalidData"));
      return;
    }

    setIsSubmitting(true);
    const { error: authError } = await authClient.signUp.email({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setIsSubmitting(false);

    if (authError) {
      setError(authError.message ?? t("errors.registerFailed"));
      return;
    }

    router.push(callbackURL);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {googleAuthEnabled && (
        <>
          <GoogleSignInButton
            callbackURL={googleCallbackURL}
            disabled={isSubmitting}
            label={t("google.register")}
          />
          <AuthDivider />
        </>
      )}

      <Field>
        <Label htmlFor="name">{t("fields.name")}</Label>
        <Input
          id="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </Field>

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
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </Field>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 rounded-lg bg-emerald-700 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-800 disabled:opacity-60"
      >
        {isSubmitting ? t("submit.creating") : t("submit.register")}
      </button>
    </form>
  );
}
