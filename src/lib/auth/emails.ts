import { sendEmail, isEmailConfigured } from "@/lib/email/send";

type AuthEmailPayload = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

/** @deprecated Use sendEmail from @/lib/email/send — kept for auth module imports. */
export async function sendAuthEmail(payload: AuthEmailPayload): Promise<void> {
  await sendEmail(payload);
}

export function isAuthEmailConfigured(): boolean {
  return isEmailConfigured();
}
