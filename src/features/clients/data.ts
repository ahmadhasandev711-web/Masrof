import "server-only";

import { cache } from "react";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { toPlain } from "@/lib/db/plain";
import { ClientModel } from "@/models/client";
import { ProjectModel } from "@/models/project";
import type { CreateClientInput } from "@/features/clients/schemas";
import type { ClientListItem } from "@/features/clients/types";

export async function createClient(input: CreateClientInput) {
  await connectToDatabase();

  const client = await ClientModel.create({
    workspaceId: input.workspaceId,
    name: input.name,
    email: input.email ?? null,
    phone: input.phone ?? null,
  });

  return client.toObject();
}

export const listClientsForWorkspace = cache(async (workspaceId: string) => {
  await connectToDatabase();

  const clients = await ClientModel.find({ workspaceId, isArchived: false })
    .sort({ name: 1 })
    .lean();

  const counts = await ProjectModel.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
    {
      $match: {
        workspaceId: new mongoose.Types.ObjectId(workspaceId),
        isArchived: false,
        clientId: { $ne: null },
      },
    },
    { $group: { _id: "$clientId", count: { $sum: 1 } } },
  ]);

  const countMap = new Map(counts.map((row) => [String(row._id), row.count]));

  return toPlain(
    clients.map(
      (client): ClientListItem => ({
        _id: String(client._id),
        name: client.name,
        email: client.email ?? null,
        phone: client.phone ?? null,
        projectCount: countMap.get(String(client._id)) ?? 0,
      }),
    ),
  );
});

export async function archiveClient(clientId: string, workspaceId: string) {
  await connectToDatabase();

  return ClientModel.findOneAndUpdate(
    { _id: clientId, workspaceId },
    { isArchived: true },
    { returnDocument: "after" },
  ).lean();
}
