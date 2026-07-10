import { isOnOrBeforeDaysFromToday } from "@/lib/dates";
import type { ProjectListItem } from "@/features/projects/types";

export function projectRemainingAmount(project: ProjectListItem): number {
  if (project.expectedAmount == null) return 0;
  return Math.max(0, project.expectedAmount - project.paidTotal);
}

export function isReceivableReminderDue(project: ProjectListItem): boolean {
  if (projectRemainingAmount(project) <= 0 || !project.dueDate || !project.clientPhone) {
    return false;
  }
  return isOnOrBeforeDaysFromToday(project.dueDate, 7);
}
