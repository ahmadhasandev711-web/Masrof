import "server-only";

import { projectsRepository } from "@/features/projects/projects.repository";
import { projectsService } from "@/features/projects/projects.service";
import type { CreateProjectInput } from "@/features/projects/schemas";

export async function createProject(input: CreateProjectInput) {
  const existing = await projectsRepository.findByIdempotencyKey(
    input.workspaceId,
    input.idempotencyKey,
  );
  if (existing) return existing;
  return projectsRepository.create(input);
}

export async function archiveProject(projectId: string, workspaceId: string) {
  return projectsRepository.archive(projectId, workspaceId);
}

export const listProjectsForWorkspace = (workspaceId: string) =>
  projectsService.listForWorkspace(workspaceId);

export const listProjectsWithTotals = (workspaceId: string) =>
  projectsService.listWithTotals(workspaceId);

export const listReceivableProjects = (workspaceId: string) =>
  projectsService.listReceivable(workspaceId);
