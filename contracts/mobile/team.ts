import { z } from "zod";

export const mobileTeamMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(["owner", "member", "viewer"]),
});

export type MobileTeamMember = z.infer<typeof mobileTeamMemberSchema>;

/** Active members only. Invites and membership writes stay on the web. */
export const mobileTeamResponseSchema = z.object({
  members: z.array(mobileTeamMemberSchema),
});
