import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createClientSchema } from "@/features/clients/schemas";
import { clientsService } from "@/features/clients/clients.service";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { requireMobileSession, requireMobileWorkspace } from "@/lib/mobile/session";
import { toMobileClient } from "@/lib/mobile/serialize";
import {
  mobileClientCreatedSchema,
  mobileClientsListResponseSchema,
} from "@contracts/mobile/clients";
import { resultToResponse, thrownToMobileResponse } from "@/server/kernel";

export async function GET(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  const access = await requireMobileWorkspace(session.user.id, workspaceId, "read");
  if (access instanceof NextResponse) return access;

  const items = await clientsService.listForWorkspace(access.workspaceId);
  const body = mobileClientsListResponseSchema.parse({
    items: items.map((item) => toMobileClient(item as Record<string, unknown>)),
  });
  return NextResponse.json(body);
}

export async function POST(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json();
    const parsed = createClientSchema(() => "invalid").safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalidData" }, { status: 400 });
    }

    const access = await requireMobileWorkspace(session.user.id, parsed.data.workspaceId, "write");
    if (access instanceof NextResponse) return access;

    const result = await clientsService.create(session.user.id, parsed.data);
    if (!result.ok) {
      return resultToResponse(result);
    }

    revalidateTag(CACHE_TAGS.clients, "max");
    return NextResponse.json(
      mobileClientCreatedSchema.parse(toMobileClient(result.value as Record<string, unknown>)),
      { status: 201 },
    );
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}
