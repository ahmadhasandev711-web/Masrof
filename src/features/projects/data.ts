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
import { InvoiceModel } from "@/models/invoice";
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

export const listProjectsWithTotals = cache(async (workspaceId: string): Promise<ProjectListItem[]> => {
  if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
    return [];
  }

  await connectToDatabase();

  const wsObjectId = new mongoose.Types.ObjectId(workspaceId);

  const [projects, txTotals, invoicedByProject, clients] = await Promise.all([
    ProjectModel.find({ workspaceId, isArchived: false })
      .select("name status expectedAmount dueDate clientId")
      .sort({ createdAt: -1 })
      .lean(),
    TransactionModel.aggregate<{
      _id: { projectId: mongoose.Types.ObjectId; type: "income" | "expense" };
      total: number;
    }>([
      {
        $match: {
          workspaceId: wsObjectId,
          projectId: { $ne: null },
          isArchived: false,
        },
      },
      {
        $group: {
          _id: { projectId: "$projectId", type: "$type" },
          total: { $sum: "$amount" },
        },
      },
    ]),
    InvoiceModel.aggregate<{ _id: mongoose.Types.ObjectId; invoicedTotal: number }>([
      {
        $match: {
          workspaceId: wsObjectId,
          projectId: { $ne: null },
          isArchived: false,
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: "$projectId",
          invoicedTotal: { $sum: { $sum: "$items.amount" } },
        },
      },
    ]),
    ClientModel.find({
      workspaceId,
      isArchived: false,
    })
      .select("_id name phone")
      .lean(),
  ]);

  const incomeMap = new Map<string, number>();
  const expenseMap = new Map<string, number>();

  for (const row of txTotals) {
    if (!row._id?.projectId) continue;
    const pId = String(row._id.projectId);
    if (row._id.type === "income") {
      incomeMap.set(pId, row.total);
    } else if (row._id.type === "expense") {
      expenseMap.set(pId, row.total);
    }
  }

  const invoicedMap = new Map<string, number>(
    invoicedByProject.map((row) => [String(row._id), row.invoicedTotal]),
  );

  const clientMap = new Map(
    clients.map((client) => [
      String(client._id),
      { name: client.name, phone: client.phone ?? null },
    ]),
  );

  return toPlain(
    projects.map(
      (project): ProjectListItem => {
        const pId = String(project._id);
        const client = project.clientId ? clientMap.get(String(project.clientId)) : null;
        const incomeTotal = incomeMap.get(pId) ?? 0;
        const expenseTotal = expenseMap.get(pId) ?? 0;
        const invoicedTotal = invoicedMap.get(pId) ?? 0;
        const netProfit = incomeTotal - expenseTotal;
        const profitMargin = incomeTotal > 0 ? Math.round((netProfit / incomeTotal) * 100) : null;
        const isOverBudget =
          project.expectedAmount != null &&
          project.expectedAmount > 0 &&
          expenseTotal > project.expectedAmount;

        return {
          _id: pId,
          name: project.name,
          status: project.status,
          expectedAmount: project.expectedAmount ?? null,
          dueDate: project.dueDate ? new Date(project.dueDate).toISOString() : null,
          clientId: project.clientId ? String(project.clientId) : null,
          clientName: client?.name ?? null,
          clientPhone: client?.phone ?? null,
          paidTotal: incomeTotal,
          incomeTotal,
          expenseTotal,
          netProfit,
          profitMargin,
          invoicedTotal,
          isOverBudget,
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
