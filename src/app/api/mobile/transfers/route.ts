import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { validationErrorCode } from "@/lib/mobile/validation";
import { transfersService } from "@/features/transfers/transfers.service";
import { createTransferSchema } from "@/features/transfers/schemas";
import { CACHE_TAGS } from "@/lib/cache-tags";
import {
  requireMobileSession,
  requireMobileWorkspace,
} from "@/lib/mobile/session";
import { toMobileTransfer } from "@/lib/mobile/serialize";
import {
  mobileTransferPatchBodySchema,
  mobileTransfersListResponseSchema,
} from "@contracts/mobile/transfers";
import { mobileOkSchema } from "@contracts/mobile/common";
import { resultToResponse, thrownToMobileResponse } from "@/server/kernel";

export async function GET(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const searchParams = new URL(request.url).searchParams;
  const workspaceId = searchParams.get("workspaceId");
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 30));

  const access = await requireMobileWorkspace(session.user.id, workspaceId, "read");
  if (access instanceof NextResponse) return access;

  const result = await transfersService.listPaginated(access.workspaceId, page, pageSize);
  return NextResponse.json(
    mobileTransfersListResponseSchema.parse({
      items: result.items.map((item) =>
        toMobileTransfer(item as unknown as Record<string, unknown>),
      ),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    }),
  );
}

export async function POST(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json();
    const parsed = createTransferSchema((key) => key).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: validationErrorCode(parsed.error) }, { status: 400 });
    }

    const access = await requireMobileWorkspace(session.user.id, parsed.data.workspaceId, "write");
    if (access instanceof NextResponse) return access;

    const result = await transfersService.create(session.user.id, parsed.data);
    if (!result.ok) {
      return resultToResponse(result);
    }

    revalidateTag(CACHE_TAGS.transfers, "max");
    revalidateTag(CACHE_TAGS.accounts, "max");
    revalidatePath("/dashboard/transactions");
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard");
    return NextResponse.json({ id: result.value }, { status: 201 });
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}

/** Cancel a transfer through the same `transfersService.archive` the web uses. */
export async function PATCH(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const parsed = mobileTransferPatchBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "invalidData" }, { status: 400 });
    }

    const access = await requireMobileWorkspace(session.user.id, parsed.data.workspaceId, "write");
    if (access instanceof NextResponse) return access;

    const result = await transfersService.archive(parsed.data.transferId, access.workspaceId);
    if (!result.ok) return resultToResponse(result);

    revalidateTag(CACHE_TAGS.transfers, "max");
    revalidateTag(CACHE_TAGS.accounts, "max");
    revalidatePath("/dashboard/transactions");
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard");
    return NextResponse.json(mobileOkSchema.parse({ ok: true }));
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}
