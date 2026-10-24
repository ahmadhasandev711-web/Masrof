import { betterAuth } from "better-auth";
import { phoneNumber } from "better-auth/plugins";
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
const SANADAT_PRODUCTION_ORIGINS = [
  "https://sanadat.site",
  "https://www.sanadat.site",
  "sanadat://",
  "sanadat://*",
];

const DEVELOPMENT_ONLY_ORIGINS = [
  "masrofaty://",
  "masrofaty://*",
  "exp://",
  "exp://*",
  "exp://**",
  "http://localhost:*",
  "http://127.0.0.1:*",
  "http://192.168.*:*",
  "http://10.*:*",
  "http://172.*:*",
];

function buildTrustedOrigins(): string[] {
  const origins = [
    env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    ...(process.env.TRUSTED_ORIGINS
      ? process.env.TRUSTED_ORIGINS.split(",").map((s) => s.trim())
      : []),
    ...SANADAT_PRODUCTION_ORIGINS,
  ];

  if (process.env.NODE_ENV !== "production") {
    origins.push(...DEVELOPMENT_ONLY_ORIGINS);
  }

  return Array.from(
    new Set(origins.filter((url): url is string => typeof url === "string" && url.trim().length > 0)),
  );
}

const trustedOrigins = buildTrustedOrigins();

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins,
  plugins: [phoneNumber()],

  database: mongodbAdapter(mongoDb),

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (user.phoneNumber) {
            const existing = await mongoDb.collection("user").findOne({ phoneNumber: user.phoneNumber });
            if (existing) {
              throw new Error("PHONE_NUMBER_ALREADY_EXISTS");
            }
          }
        },
        after: async (user) => {
          if (user.phoneNumber) {
            try {
              const { UserSettingsModel } = await import("@/models/user-settings");
              await UserSettingsModel.updateOne(
                { userId: user.id },
                { $set: { whatsappPhone: user.phoneNumber } },
                { upsert: true },
              );
            } catch (err) {
              console.error("Failed to sync user settings phone:", err);
            }
          }
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
            subject: "إعادة تعيين كلمة المرور — سندات",
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
            subject: "تأكيد بريدك الإلكتروني — سندات",
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

  advanced: {
    ipAddress: {
      ipAddressHeaders: ["x-forwarded-for", "x-real-ip", "cf-connecting-ip"],
    },
  },
});

export type Session = typeof auth.$Infer.Session;

export function isGoogleAuthEnabled(): boolean {
  return !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}

export { appUrl, emailFeaturesEnabled };
