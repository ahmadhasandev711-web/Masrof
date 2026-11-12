import { NextResponse } from "next/server";
import { transactionsService } from "@/features/transactions/transactions.service";
import {
  createTransactionSchema,
  transactionFiltersSchema,
} from "@/features/transactions/schemas";
import {
  requireMobileSession,
  requireMobileWorkspace,
} from "@/lib/mobile/session";
import { toMobileTransaction } from "@/lib/mobile/serialize";
import {
  mobileTransactionCreatedSchema,
  mobileTransactionsPageResponseSchema,
} from "@contracts/mobile/transactions";
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
    const parsed = createTransactionSchema(() => "invalid").safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalidData" }, { status: 400 });
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
