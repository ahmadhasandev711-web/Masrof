import "server-only";

import { connectToDatabase } from "@/lib/db/mongoose";
import { WorkspaceInvitationModel } from "@/models/workspace-invitation";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_INVITES_PER_HOUR = 20;

export async function assertInviteRateLimit(userId: string): Promise<void> {
  await connectToDatabase();
  const since = new Date(Date.now() - WINDOW_MS);
  const count = await WorkspaceInvitationModel.countDocuments({
    invitedBy: userId,
    createdAt: { $gte: since },
  });
  if (count >= MAX_INVITES_PER_HOUR) {
    throw new Error("inviteRateLimited");
  }
}
