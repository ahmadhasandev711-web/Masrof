import "server-only";

import { getTranslations } from "next-intl/server";
import { sendEmail } from "@/lib/email/send";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function sendWorkspaceInviteEmail(input: {
  to: string;
  workspaceName: string;
  token: string;
  inviterName: string;
}) {
  const t = await getTranslations("emails.workspaceInvite");
  const inviteUrl = `${appUrl}/invite/${input.token}`;

  await sendEmail({
    to: input.to,
    subject: t("subject", { workspace: input.workspaceName }),
    text: t("text", {
      workspace: input.workspaceName,
      inviter: input.inviterName,
      url: inviteUrl,
    }),
    html: `<p>${t("htmlIntro", { workspace: input.workspaceName, inviter: input.inviterName })}</p><p><a href="${inviteUrl}">${inviteUrl}</a></p>`,
  });
}
