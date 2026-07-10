import "server-only";

import { isAdminEmail } from "@/lib/admin";
import { mongoDb } from "@/lib/db/mongo-client";

function isCorruptedDisplayName(name: string | null | undefined): boolean {
  if (!name?.trim()) return false;
  // Broken UTF-8 (e.g. PowerShell sign-up) often becomes only "?" characters.
  return !/[\p{L}\p{N}]/u.test(name);
}

/**
 * Repairs admin display names that were saved with broken encoding.
 * Returns the name to show in the UI (updated in MongoDB when repaired).
 */
export async function repairAdminDisplayName(
  email: string,
  currentName: string | null | undefined,
): Promise<string | null | undefined> {
  const repairedName = process.env.SEED_ADMIN_NAME?.trim();
  if (!repairedName || !isAdminEmail(email) || !isCorruptedDisplayName(currentName)) {
    return currentName;
  }

  await mongoDb.collection("user").updateOne(
    { email },
    { $set: { name: repairedName, updatedAt: new Date() } },
  );

  return repairedName;
}
