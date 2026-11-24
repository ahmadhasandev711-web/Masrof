import { z } from "zod";

export const mobileBackupExportResponseSchema = z.object({
  filename: z.string(),
  json: z.string(),
});

export const mobileBackupRestoreResponseSchema = z.object({
  workspaceId: z.string(),
});

export type MobileBackupExportResponse = z.infer<typeof mobileBackupExportResponseSchema>;
export type MobileBackupRestoreResponse = z.infer<typeof mobileBackupRestoreResponseSchema>;
