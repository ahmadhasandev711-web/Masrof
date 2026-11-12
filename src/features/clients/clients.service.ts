import "server-only";

import { countClientsForWorkspace } from "@/features/subscriptions/plan-usage";
import type { CreateClientInput } from "@/features/clients/schemas";
import {
  ClientsRepository,
  clientsRepository,
} from "@/features/clients/clients.repository";
import { NotFoundError } from "@/server/kernel/errors";
import { err, ok, type Result } from "@/server/kernel/result";
import { requirePlanFeature, requireQuantityLimit } from "@/server/kernel/plan-policy";

export class ClientsService {
  constructor(private readonly repo: ClientsRepository = clientsRepository) {}

  async create(userId: string, input: CreateClientInput) {
    const feature = await requirePlanFeature(userId, input.workspaceId, "clientsAndProjects");
    if (!feature.ok) return feature;

    const clientCount = await countClientsForWorkspace(input.workspaceId);
    const limit = await requireQuantityLimit(
      userId,
      input.workspaceId,
      "maxClients",
      clientCount,
    );
    if (!limit.ok) return limit;

    const existing = await this.repo.findByIdempotencyKey(input.workspaceId, input.idempotencyKey);
    if (existing) return ok(existing);

    const created = await this.repo.create(input);
    return ok(created);
  }

  async update(
    clientId: string,
    workspaceId: string,
    input: { name: string; email: string | null; phone: string | null },
  ): Promise<Result<NonNullable<Awaited<ReturnType<ClientsRepository["update"]>>>>> {
    const updated = await this.repo.update(clientId, workspaceId, input);
    if (!updated) return err(new NotFoundError("clientNotFound"));
    return ok(updated);
  }

  async archive(clientId: string, workspaceId: string) {
    const archived = await this.repo.archive(clientId, workspaceId);
    if (!archived) return err(new NotFoundError("clientNotFound"));
    return ok(archived);
  }

  listForWorkspace(workspaceId: string) {
    return this.repo.listForWorkspace(workspaceId);
  }

  listWithFinancials(workspaceId: string) {
    return this.repo.listWithFinancials(workspaceId);
  }
}

export const clientsService = new ClientsService();
