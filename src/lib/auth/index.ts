import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { mongoDb } from "@/lib/db/mongo-client";
import { env } from "@/lib/env";
import { isAuthEmailConfigured, sendAuthEmail } from "@/lib/auth/emails";
import { sendWelcomeNotification } from "@/features/notifications/dispatch";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const emailFeaturesEnabled = isAuthEmailConfigured();

/**
 * The single, shared better-auth instance for the whole application.
 * Import `auth` wherever a session needs to be read or an auth API
 * route needs to be exposed — never construct a second instance.
 */
export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,

  database: mongodbAdapter(mongoDb),

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          if (!user.email) return;
          await sendWelcomeNotification({
            userId: user.id,
            email: user.email,
            name: user.name ?? "",
          });
        },
      },
    },
  },

  onAPIError: {
    errorURL: `${appUrl}/login`,
  },

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
      // Google verifies email — allow linking to an existing local account
      // with the same address even if local email verification is pending.
      requireLocalEmailVerified: false,
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: emailFeaturesEnabled,
    minPasswordLength: 8,
    sendResetPassword: emailFeaturesEnabled
      ? async ({ user, url }) => {
          await sendAuthEmail({
            to: user.email,
            subject: "إعادة تعيين كلمة المرور — مصروفاتي",
            text: `اضغط الرابط التالي لإعادة تعيين كلمة المرور:\n\n${url}\n\nلو ماطلبتش ده، تجاهل الرسالة.`,
            html: `<p>اضغط الرابط التالي لإعادة تعيين كلمة المرور:</p><p><a href="${url}">${url}</a></p><p>لو ماطلبتش ده، تجاهل الرسالة.</p>`,
          });
        }
      : undefined,
  },

  emailVerification: emailFeaturesEnabled
    ? {
        sendOnSignUp: true,
        sendOnSignIn: true,
        autoSignInAfterVerification: true,
        sendVerificationEmail: async ({ user, url }) => {
          await sendAuthEmail({
            to: user.email,
            subject: "تأكيد بريدك الإلكتروني — مصروفاتي",
            text: `أهلاً ${user.name ?? ""},\n\nاضغط الرابط لتأكيد بريدك:\n\n${url}`,
            html: `<p>أهلاً ${user.name ?? ""},</p><p>اضغط الرابط لتأكيد بريدك:</p><p><a href="${url}">${url}</a></p>`,
          });
        },
      }
    : undefined,

  socialProviders:
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        }
      : undefined,

  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
});

export type Session = typeof auth.$Infer.Session;

export function isGoogleAuthEnabled(): boolean {
  return !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}

export { appUrl, emailFeaturesEnabled };
