import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { validationErrorCode } from "@/lib/mobile/validation";
import { createClientSchema, updateClientSchema } from "@/features/clients/schemas";
import { clientsService } from "@/features/clients/clients.service";
import { getEffectiveSubscriptionForWorkspace } from "@/features/subscriptions/data";
import { getPlanQuantityLimit } from "@/features/subscriptions/plan-config-data";
import { countClientsForWorkspace, toQuantityUsage } from "@/features/subscriptions/plan-usage";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { requireMobileSession, requireMobileWorkspace } from "@/lib/mobile/session";
import { toMobileClient } from "@/lib/mobile/serialize";
import {
  mobileClientCreatedSchema,
  mobileClientPatchBodySchema,
  mobileClientsListResponseSchema,
} from "@contracts/mobile/clients";
import { mobileOkSchema } from "@contracts/mobile/common";
import { resultToResponse, thrownToMobileResponse } from "@/server/kernel";

/** Same data as /dashboard/clients: financial totals per client + the maxClients meter. */
export async function GET(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  const access = await requireMobileWorkspace(session.user.id, workspaceId, "read");
  if (access instanceof NextResponse) return access;

  try {
    const [items, used, subscription] = await Promise.all([
      clientsService.listWithFinancials(access.workspaceId),
      countClientsForWorkspace(access.workspaceId),
      getEffectiveSubscriptionForWorkspace(session.user.id, access.workspaceId),
    ]);
    const limit = await getPlanQuantityLimit(subscription.plan, "maxClients");
    return NextResponse.json(
      mobileClientsListResponseSchema.parse({
        items: items.map((item) => toMobileClient(item as unknown as Record<string, unknown>)),
        usage: toQuantityUsage(used, limit),
      }),
    );
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}

export async function POST(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json();
    // Identity translator: the issue message is the `validation.*` key the app translates.
    const parsed = createClientSchema((key) => key).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: validationErrorCode(parsed.error) }, { status: 400 });
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

/** Edit or archive, through the same service methods as the web actions. */
export async function PATCH(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const parsed = mobileClientPatchBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "invalidData" }, { status: 400 });
    }
    const body = parsed.data;
    const access = await requireMobileWorkspace(session.user.id, body.workspaceId, "write");
    if (access instanceof NextResponse) return access;

    if (body.action === "update") {
      const input = updateClientSchema((key) => key).safeParse({
        ...body,
        workspaceId: access.workspaceId,
      });
      if (!input.success) {
        return NextResponse.json({ error: validationErrorCode(input.error) }, { status: 400 });
      }
      const result = await clientsService.update(input.data.clientId, access.workspaceId, {
        name: input.data.name,
        email: input.data.email,
        phone: input.data.phone,
      });
      if (!result.ok) return resultToResponse(result);
    } else {
      const result = await clientsService.archive(body.clientId, access.workspaceId);
      if (!result.ok) return resultToResponse(result);
    }

    revalidateTag(CACHE_TAGS.clients, "max");
    revalidatePath("/dashboard/clients");
    return NextResponse.json(mobileOkSchema.parse({ ok: true }));
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}
