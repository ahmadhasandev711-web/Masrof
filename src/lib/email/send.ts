import "server-only";

import nodemailer from "nodemailer";
import { env } from "@/lib/env";

export type EmailPayload = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

/**
 * Sends transactional email via SMTP (Hostinger / custom) or Resend when configured.
 * Otherwise logs to the server console (local development).
 */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  const from = env.AUTH_EMAIL_FROM || (env.SMTP_USER ? `سندات <${env.SMTP_USER}>` : undefined);

  // 1. Hostinger / Custom SMTP
  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && from) {
    try {
      const transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT ?? 465,
        secure: env.SMTP_SECURE ?? (env.SMTP_PORT === 465),
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      });
      return;
    } catch (err) {
      console.warn("[email] Hostinger/SMTP send failed:", err);
    }
  }

  // 2. Resend API
  if (env.RESEND_API_KEY && from) {
    try {
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
        signal: AbortSignal.timeout(3500),
      });

      if (!response.ok) {
        const body = await response.text();
        console.warn(`[email] Resend send warning: ${body}`);
      }
    } catch (err) {
      console.warn("[email] Resend request failed or timed out:", err);
    }
    return;
  }

  console.log("\n📧 سندات — بريد");
  console.log(`إلى: ${payload.to}`);
  console.log(`الموضوع: ${payload.subject}`);
  console.log("---");
  console.log(payload.text);
  console.log("---\n");
}

export function isEmailConfigured(): boolean {
  return Boolean(
    (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) ||
    (env.RESEND_API_KEY && env.AUTH_EMAIL_FROM),
  );
}
