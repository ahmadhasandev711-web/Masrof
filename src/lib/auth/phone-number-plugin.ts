import { phoneNumber } from "better-auth/plugins";

/**
 * Wraps Better Auth's built-in `phoneNumber` plugin for email-verified onboarding.
 *
 * Upstream `phoneNumber()` installs a `user.create.before` database hook (and an
 * `/update-user` middleware hook) that reject `signUp.email` payloads containing a
 * `phoneNumber` unless SMS OTP verification already set `phoneNumberVerified: true`.
 * Since Sanadat collects phone numbers during email signup and verifies accounts by
 * email, keeping the plugin's schema, endpoints (`/sign-in/phone-number`), and rate
 * limits while omitting `init`/`hooks` unblocks signup without losing phone login.
 */
export function sanadatPhoneNumberPlugin() {
  const basePlugin = phoneNumber();
  const { init: _omitInit, hooks: _omitHooks, ...rest } = basePlugin;
  void _omitInit;
  void _omitHooks;
  return rest;
}
