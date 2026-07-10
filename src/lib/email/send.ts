import "server-only";

import { env } from "@/lib/env";

export type EmailPayload = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

/**
 * Sends transactional email via Resend when configured.
 * Otherwise logs to the server console (local development).
 */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  const from = env.AUTH_EMAIL_FROM;

  if (env.RESEND_API_KEY && from) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed to send email via Resend: ${body}`);
    }
    return;
  }

  console.log("\n📧 مصروفاتي — بريد");
  console.log(`إلى: ${payload.to}`);
  console.log(`الموضوع: ${payload.subject}`);
  console.log("---");
  console.log(payload.text);
  console.log("---\n");
}

export function isEmailConfigured(): boolean {
  return Boolean(env.RESEND_API_KEY && env.AUTH_EMAIL_FROM);
}
