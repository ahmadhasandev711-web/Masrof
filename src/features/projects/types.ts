import type { ProjectStatus } from "@/features/projects/constants";

export type ProjectListItem = {
  _id: string;
  name: string;
  status: ProjectStatus;
  expectedAmount: number | null;
  dueDate: string | null;
  clientId: string | null;
  clientName: string | null;
  clientPhone: string | null;
  paidTotal: number;
};
