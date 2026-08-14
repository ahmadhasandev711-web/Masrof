import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { toPlain } from "@/lib/db/plain";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { ClientModel } from "@/models/client";
import { ProjectModel } from "@/models/project";
import { TransactionModel } from "@/models/transaction";
import { toMinorUnits } from "@/lib/money";
import type { CreateProjectInput } from "@/features/projects/schemas";
import type { ProjectListItem } from "@/features/projects/types";
import { isReceivableReminderDue } from "@/features/projects/utils";

export async function createProject(input: CreateProjectInput) {
  await connectToDatabase();

  const project = await ProjectModel.create({
    workspaceId: input.workspaceId,
    clientId: input.clientId,
    name: input.name,
    status: input.status,
    expectedAmount:
      input.expectedAmount != null ? toMinorUnits(input.expectedAmount) : null,
    dueDate: input.dueDate ?? null,
    description: input.description ?? "",
  });

  return project.toObject();
}

export const listProjectsForWorkspace = unstable_cache(
  async (workspaceId: string) => {
    await connectToDatabase();

    const docs = await ProjectModel.find({ workspaceId, isArchived: false })
      .sort({ createdAt: -1 })
      .lean();

    return docs.map((doc) => toPlain(doc));
  },
  ["projects-for-workspace"],
  { revalidate: 30, tags: [CACHE_TAGS.projects] },
);

export const listProjectsWithTotals = cache(async (workspaceId: string) => {
  await connectToDatabase();

  const projects = await ProjectModel.find({ workspaceId, isArchived: false })
    .sort({ createdAt: -1 })
    .lean();

  const [paidByProject, clients] = await Promise.all([
    TransactionModel.aggregate<{ _id: mongoose.Types.ObjectId; paidTotal: number }>([
      {
        $match: {
          workspaceId: new mongoose.Types.ObjectId(workspaceId),
          projectId: { $ne: null },
          type: "income",
          isArchived: false,
        },
      },
      { $group: { _id: "$projectId", paidTotal: { $sum: "$amount" } } },
    ]),
    ClientModel.find({
      workspaceId,
      isArchived: false,
    })
      .select("_id name phone")
      .lean(),
  ]);

  const paidMap = new Map(paidByProject.map((row) => [String(row._id), row.paidTotal]));
  const clientMap = new Map(
    clients.map((client) => [
      String(client._id),
      { name: client.name, phone: client.phone ?? null },
    ]),
  );

  return toPlain(
    projects.map(
      (project): ProjectListItem => {
        const client = project.clientId ? clientMap.get(String(project.clientId)) : null;
        return {
          _id: String(project._id),
          name: project.name,
          status: project.status,
          expectedAmount: project.expectedAmount ?? null,
          dueDate: project.dueDate ? new Date(project.dueDate).toISOString() : null,
          clientId: project.clientId ? String(project.clientId) : null,
          clientName: client?.name ?? null,
          clientPhone: client?.phone ?? null,
          paidTotal: paidMap.get(String(project._id)) ?? 0,
        };
      },
    ),
  );
});

export const listReceivableProjects = cache(async (workspaceId: string) => {
  const projects = await listProjectsWithTotals(workspaceId);
  return projects.filter(isReceivableReminderDue);
});

export async function archiveProject(projectId: string, workspaceId: string) {
  await connectToDatabase();

  return ProjectModel.findOneAndUpdate(
    { _id: projectId, workspaceId },
    { isArchived: true },
    { returnDocument: "after" },
  ).lean();
}
