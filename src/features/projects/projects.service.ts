import "server-only";

import { countActiveProjectsForWorkspace } from "@/features/subscriptions/plan-usage";
import type { CreateProjectInput, UpdateProjectStatusInput } from "@/features/projects/schemas";
import {
  ProjectsRepository,
  projectsRepository,
} from "@/features/projects/projects.repository";
import { InvalidReferenceError, NotFoundError } from "@/server/kernel/errors";
import { err, ok } from "@/server/kernel/result";
import { requirePlanFeature, requireQuantityLimit } from "@/server/kernel/plan-policy";

export class ProjectsService {
  constructor(private readonly repo: ProjectsRepository = projectsRepository) {}

  async create(userId: string, input: CreateProjectInput) {
    const feature = await requirePlanFeature(userId, input.workspaceId, "clientsAndProjects");
    if (!feature.ok) return feature;

    if (input.status === "active") {
      const activeCount = await countActiveProjectsForWorkspace(input.workspaceId);
      const limit = await requireQuantityLimit(
        userId,
        input.workspaceId,
        "maxActiveProjects",
        activeCount,
      );
      if (!limit.ok) return limit;
    }

    const existing = await this.repo.findByIdempotencyKey(input.workspaceId, input.idempotencyKey);
    if (existing) return ok(existing);

    return ok(await this.repo.create(input));
  }

  /**
   * Move a project between active / completed / on hold. Re-activating counts
   * against `maxActiveProjects`, same as creating an active project.
   */
  async updateStatus(userId: string, input: UpdateProjectStatusInput) {
    const project = await this.repo.findActive(input.projectId, input.workspaceId);
    if (!project) return err(new NotFoundError("projectNotFound"));

    if (input.status === "active" && project.status !== "active") {
      const activeCount = await countActiveProjectsForWorkspace(input.workspaceId);
      const limit = await requireQuantityLimit(
        userId,
        input.workspaceId,
        "maxActiveProjects",
        activeCount,
      );
      if (!limit.ok) return limit;
    }

    const updated = await this.repo.updateStatus(input.projectId, input.workspaceId, input.status);
    if (!updated) return err(new NotFoundError("projectNotFound"));
    return ok(updated);
  }

  /** Same rule as clients: no archiving while the project has invoices still due. */
  async archive(projectId: string, workspaceId: string) {
    if ((await this.repo.countOpenInvoices(projectId, workspaceId)) > 0) {
      return err(new InvalidReferenceError("projectHasOpenInvoices"));
    }
    const archived = await this.repo.archive(projectId, workspaceId);
    if (!archived) return err(new NotFoundError("projectNotFound"));
    return ok(archived);
  }

  listForWorkspace(workspaceId: string) {
    return this.repo.listForWorkspace(workspaceId);
  }

  listWithTotals(workspaceId: string) {
    return this.repo.listWithTotals(workspaceId);
  }

  listReceivable(workspaceId: string) {
    return this.repo.listReceivable(workspaceId);
  }
}

export const projectsService = new ProjectsService();
