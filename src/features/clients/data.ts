import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongoose";
import { toPlain } from "@/lib/db/plain";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { ClientModel } from "@/models/client";
import { ProjectModel } from "@/models/project";
import { InvoiceModel } from "@/models/invoice";
import { InvoicePaymentModel } from "@/models/invoice-payment";
import type { CreateClientInput } from "@/features/clients/schemas";
import type { ClientListItem } from "@/features/clients/types";
import {
  findWorkspaceIdempotentId,
  registerWorkspaceIdempotentResource,
} from "@/lib/idempotency/workspace-resource";

export async function createClient(input: CreateClientInput) {
  await connectToDatabase();

  const existingId = await findWorkspaceIdempotentId(input.workspaceId, input.idempotencyKey);
  if (existingId) {
    const existing = await ClientModel.findOne({
      _id: existingId,
      workspaceId: input.workspaceId,
    }).lean();
    if (existing) return existing;
  }

  const client = await ClientModel.create({
    workspaceId: input.workspaceId,
    name: input.name,
    email: input.email ?? null,
    phone: input.phone ?? null,
  });

  await registerWorkspaceIdempotentResource(
    input.workspaceId,
    input.idempotencyKey,
    "client",
    client._id.toString(),
  );

  return client.toObject();
}

export async function updateClient(
  clientId: string,
  workspaceId: string,
  input: { name: string; email: string | null; phone: string | null },
) {
  await connectToDatabase();

  return ClientModel.findOneAndUpdate(
    { _id: clientId, workspaceId, isArchived: false },
    { name: input.name, email: input.email, phone: input.phone },
    { returnDocument: "after" },
  ).lean();
}

export const listClientsForWorkspace = unstable_cache(
  async (workspaceId: string) => {
    await connectToDatabase();

    const clients = await ClientModel.find({ workspaceId, isArchived: false })
      .select("name email phone")
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
          invoicedTotal: 0,
          paidTotal: 0,
          outstandingBalance: 0,
        }),
      ),
    );
  },
  ["clients-for-workspace"],
  { revalidate: 30, tags: [CACHE_TAGS.clients] },
);

export const listClientsWithFinancials = cache(
  async (workspaceId: string): Promise<ClientListItem[]> => {
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      return [];
    }

    await connectToDatabase();
    const wsObjectId = new mongoose.Types.ObjectId(workspaceId);

    const [clients, projectCounts, invoices, payments] = await Promise.all([
      ClientModel.find({ workspaceId: wsObjectId, isArchived: false })
        .select("name email phone")
        .sort({ name: 1 })
        .lean(),
      ProjectModel.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
        {
          $match: {
            workspaceId: wsObjectId,
            isArchived: false,
            clientId: { $ne: null },
          },
        },
        { $group: { _id: "$clientId", count: { $sum: 1 } } },
      ]),
      InvoiceModel.find({
        workspaceId: wsObjectId,
        isArchived: false,
        status: { $ne: "cancelled" },
      })
        .select("_id clientId items status")
        .lean(),
      InvoicePaymentModel.aggregate<{ _id: mongoose.Types.ObjectId; paidTotal: number }>([
        {
          $match: {
            workspaceId: wsObjectId,
            isArchived: false,
          },
        },
        {
          $group: {
            _id: "$invoiceId",
            paidTotal: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    const countMap = new Map(projectCounts.map((row) => [String(row._id), row.count]));
    const paidMap = new Map(payments.map((p) => [String(p._id), p.paidTotal]));

    // Aggregate invoiced, paid, outstanding per client
    const clientInvoicedMap = new Map<string, number>();
    const clientPaidMap = new Map<string, number>();
    const clientOutstandingMap = new Map<string, number>();

    for (const inv of invoices) {
      const cId = String(inv.clientId);
      const totalAmount = inv.items.reduce((sum, item) => sum + item.amount, 0);
      let paid = paidMap.get(String(inv._id)) ?? 0;
      if (inv.status === "paid" && paid === 0) {
        paid = totalAmount; // Legacy paid invoice compatibility
      }
      const remaining = Math.max(0, totalAmount - paid);

      clientInvoicedMap.set(cId, (clientInvoicedMap.get(cId) ?? 0) + totalAmount);
      clientPaidMap.set(cId, (clientPaidMap.get(cId) ?? 0) + paid);
      clientOutstandingMap.set(cId, (clientOutstandingMap.get(cId) ?? 0) + remaining);
    }

    return toPlain(
      clients.map((client): ClientListItem => {
        const id = String(client._id);
        const invoiced = clientInvoicedMap.get(id) ?? 0;
        const paid = clientPaidMap.get(id) ?? 0;
        const outstanding = clientOutstandingMap.get(id) ?? 0;

        return {
          _id: id,
          name: client.name,
          email: client.email ?? null,
          phone: client.phone ?? null,
          projectCount: countMap.get(id) ?? 0,
          invoicedTotal: invoiced,
          paidTotal: paid,
          outstandingBalance: outstanding,
        };
      }),
    );
  },
);

export async function archiveClient(clientId: string, workspaceId: string) {
  await connectToDatabase();

  return ClientModel.findOneAndUpdate(
    { _id: clientId, workspaceId },
    { isArchived: true },
    { returnDocument: "after" },
  ).lean();
}
