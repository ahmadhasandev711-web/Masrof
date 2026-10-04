"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth/client";
import { createRegisterSchema } from "@/features/auth/schemas";
import { safeRedirectPath } from "@/features/auth/redirect";
import { Field, Input, Label } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { AuthDivider, GoogleSignInButton } from "@/features/auth/components/google-sign-in-button";
import { normalizePhoneNumber } from "@/lib/phone";
import { checkAccountAvailability } from "@/features/auth/actions/check-availability";

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
  const [phoneNumber, setPhoneNumber] = useState("");
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

    const parsed = registerSchema.safeParse({ name, email, phoneNumber, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? tValidation("invalidData"));
      return;
    }

    const normalizedPhone = normalizePhoneNumber(parsed.data.phoneNumber);
    if (!normalizedPhone) {
      setError(t("errors.phoneInvalid"));
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Check uniqueness of email and phone before calling signup
      const availability = await checkAccountAvailability({
        email: parsed.data.email,
        phoneNumber: normalizedPhone,
      });

      if (availability.emailTaken) {
        setError(t("errors.emailAlreadyInUse"));
        setIsSubmitting(false);
        return;
      }

      if (availability.phoneTaken) {
        setError(t("errors.phoneAlreadyInUse"));
        setIsSubmitting(false);
        return;
      }

      // 2. Call better-auth signUp
      const { error: authError } = await authClient.signUp.email({
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        phoneNumber: normalizedPhone,
      } as Parameters<typeof authClient.signUp.email>[0]);

      if (authError) {
        const rawMessage = authError.message ?? "";
        if (rawMessage.includes("PHONE_NUMBER_ALREADY_EXISTS")) {
          setError(t("errors.phoneAlreadyInUse"));
        } else if (rawMessage.toLowerCase().includes("email") && rawMessage.toLowerCase().includes("exist")) {
          setError(t("errors.emailAlreadyInUse"));
        } else {
          setError(rawMessage || t("errors.registerFailed"));
        }
        setIsSubmitting(false);
        return;
      }

      router.push(callbackURL);
      router.refresh();
    } catch {
      setError(t("errors.registerFailed"));
      setIsSubmitting(false);
    }
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
        <Label htmlFor="phoneNumber">{t("fields.phoneNumber")}</Label>
        <Input
          id="phoneNumber"
          type="tel"
          autoComplete="tel"
          dir="ltr"
          placeholder={t("fields.phoneNumberPlaceholder")}
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
        />
      </Field>

      <Field>
        <Label htmlFor="email">{t("fields.email")}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          dir="ltr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </Field>

      <Field>
        <Label htmlFor="password">{t("fields.password")}</Label>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </Field>

      {error && (
        <p role="alert" className="text-sm font-medium text-red-600">
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
