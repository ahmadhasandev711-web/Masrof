import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { validationErrorCode } from "@/lib/mobile/validation";
import { createDebtSchema } from "@/features/debts/schemas";
import { debtsService } from "@/features/debts/debts.service";
import {
  requireMobileSession,
  requireMobileWorkspace,
} from "@/lib/mobile/session";
import {
  mobileDebtPatchBodySchema,
  mobileDebtsListResponseSchema,
} from "@contracts/mobile/debts";
import { mobileOkSchema } from "@contracts/mobile/common";
import { resultToResponse, thrownToMobileResponse } from "@/server/kernel";

export async function GET(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  const statusRaw = url.searchParams.get("status");
  const status = statusRaw === "active" || statusRaw === "paid" ? statusRaw : undefined;

  const access = await requireMobileWorkspace(session.user.id, workspaceId, "read");
  if (access instanceof NextResponse) return access;

  const feature = await debtsService.requireAccess(session.user.id, access.workspaceId);
  if (!feature.ok) return resultToResponse(feature);

  try {
    const [items, summary] = await Promise.all([
      debtsService.listForWorkspace(access.workspaceId, status ? { status } : undefined),
      debtsService.getSummary(access.workspaceId, access.workspace.currency),
    ]);

    return NextResponse.json(mobileDebtsListResponseSchema.parse({ items, summary }));
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}

export async function POST(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const parsed = createDebtSchema((key) => key).safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: validationErrorCode(parsed.error) }, { status: 400 });
    }

    const access = await requireMobileWorkspace(session.user.id, parsed.data.workspaceId, "write");
    if (access instanceof NextResponse) return access;

    const feature = await debtsService.requireAccess(session.user.id, access.workspaceId);
    if (!feature.ok) return resultToResponse(feature);

    const result = await debtsService.create(session.user.id, {
      ...parsed.data,
      currency: access.workspace.currency,
    });
    if (!result.ok) return resultToResponse(result);

    revalidatePath("/dashboard/debts");
    revalidatePath("/dashboard");
    return NextResponse.json({ id: result.value }, { status: 201 });
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}

/** Archive a debt through the same `debtsService.archive` the web uses. */
export async function PATCH(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const parsed = mobileDebtPatchBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "invalidData" }, { status: 400 });
    }

    const access = await requireMobileWorkspace(session.user.id, parsed.data.workspaceId, "write");
    if (access instanceof NextResponse) return access;

    const feature = await debtsService.requireAccess(session.user.id, access.workspaceId);
    if (!feature.ok) return resultToResponse(feature);

    const result = await debtsService.archive(access.workspaceId, parsed.data.debtId);
    if (!result.ok) return resultToResponse(result);

    revalidatePath("/dashboard/debts");
    revalidatePath("/dashboard");
    return NextResponse.json(mobileOkSchema.parse({ ok: true }));
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}
