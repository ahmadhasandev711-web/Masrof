import { z } from "zod";

/**
 * Server-side environment variables.
 * This file is the ONLY place allowed to read `process.env` directly.
 * Every other module must import `env` from here.
 *
 * If a required variable is missing or malformed, the app fails fast
 * at boot time instead of failing later with a confusing runtime error.
 */
const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // --- Database ---
  MONGODB_URI: z
    .string()
    .min(1, "MONGODB_URI is required")
    .refine(
      (val) => val.startsWith("mongodb://") || val.startsWith("mongodb+srv://"),
      "MONGODB_URI must be a valid MongoDB connection string",
    ),
  MONGODB_DB_NAME: z.string().min(1).default("masrofaty"),

  // --- Auth (better-auth) ---
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.string().url("BETTER_AUTH_URL must be a valid URL"),

  // --- Email (optional — console fallback in development) ---
  RESEND_API_KEY: z.string().optional(),
  // Hostinger / custom SMTP
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional().default(465),
  SMTP_SECURE: z
    .preprocess(
      (val) => (val === "true" || val === true || val === "1" ? true : val === "false" || val === false || val === "0" ? false : undefined),
      z.boolean().optional(),
    )
    .optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  // Format: "سندات <info@sanadat.site>"
  AUTH_EMAIL_FROM: z.string().min(3).optional(),

  // --- OAuth providers (optional at this stage) ---
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // --- Platform admin (comma-separated emails) ---
  ADMIN_EMAILS: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

function loadServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    // Fail fast and loudly. A misconfigured env should never reach production silently.
    throw new Error(
      `\n❌ Invalid environment variables:\n${formatted}\n\nCheck your .env.local file against .env.example.\n`,
    );
  }

  return parsed.data;
}

// Only validate on the server. This module must never be imported from client components.
export const env = loadServerEnv();
