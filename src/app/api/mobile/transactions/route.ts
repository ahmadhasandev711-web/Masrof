import { NextResponse } from "next/server";
import { validationErrorCode } from "@/lib/mobile/validation";
import { transactionsService } from "@/features/transactions/transactions.service";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  createTransactionSchema,
  createUpdateTransactionSchema,
  transactionFiltersSchema,
} from "@/features/transactions/schemas";
import { CACHE_TAGS } from "@/lib/cache-tags";
import {
  requireMobileSession,
  requireMobileWorkspace,
} from "@/lib/mobile/session";
import { toMobileTransaction } from "@/lib/mobile/serialize";
import {
  mobileTransactionCreatedSchema,
  mobileTransactionPatchBodySchema,
  mobileTransactionsPageResponseSchema,
} from "@contracts/mobile/transactions";
import { mobileOkSchema } from "@contracts/mobile/common";
import { resultToResponse, thrownToMobileResponse } from "@/server/kernel";

export async function GET(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const url = new URL(request.url);
  const raw = Object.fromEntries(url.searchParams.entries());
  const parsed = transactionFiltersSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalidData" }, { status: 400 });
  }

  const access = await requireMobileWorkspace(session.user.id, parsed.data.workspaceId, "read");
  if (access instanceof NextResponse) return access;

  try {
    const result = await transactionsService.list(parsed.data);
    return NextResponse.json(
      mobileTransactionsPageResponseSchema.parse({
        items: result.items.map((item) =>
          toMobileTransaction(item as unknown as Record<string, unknown>),
        ),
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
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
    const parsed = createTransactionSchema((key) => key).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: validationErrorCode(parsed.error) },
        { status: 400 },
      );
    }

    const access = await requireMobileWorkspace(session.user.id, parsed.data.workspaceId, "write");
    if (access instanceof NextResponse) return access;

    const result = await transactionsService.create(session.user.id, parsed.data);
    if (!result.ok) {
      return resultToResponse(result);
    }

    return NextResponse.json(
      mobileTransactionCreatedSchema.parse({ id: result.value }),
      { status: 201 },
    );
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}

/**
 * Edit or delete a transaction — the same service calls as the web's
 * update/archive actions (balance reversed and re-applied atomically).
 * Payment-booked transactions are refused by the service: void the payment instead.
 */
export async function PATCH(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const parsed = mobileTransactionPatchBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "invalidData" }, { status: 400 });
    }
    const body = parsed.data;
    const access = await requireMobileWorkspace(session.user.id, body.workspaceId, "write");
    if (access instanceof NextResponse) return access;

    if (body.action === "update") {
      const input = createUpdateTransactionSchema((key) => key).safeParse({
        ...body,
        workspaceId: access.workspaceId,
      });
      if (!input.success) {
        return NextResponse.json({ error: validationErrorCode(input.error) }, { status: 400 });
      }
      const result = await transactionsService.update(input.data, access.workspaceId);
      if (!result.ok) return resultToResponse(result);
    } else {
      const result = await transactionsService.archive(body.transactionId, access.workspaceId);
      if (!result.ok) return resultToResponse(result);
    }

    revalidateTag(CACHE_TAGS.budgets, "max");
    revalidatePath("/dashboard/transactions");
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard");
    return NextResponse.json(mobileOkSchema.parse({ ok: true }));
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}
