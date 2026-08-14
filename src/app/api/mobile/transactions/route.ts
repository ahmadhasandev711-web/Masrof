import { NextResponse } from "next/server";
import { createTransaction, listTransactions } from "@/features/transactions/data";
import {
  createTransactionSchema,
  transactionFiltersSchema,
} from "@/features/transactions/schemas";
import {
  mobileErrorResponse,
  populatedName,
  requireMobileSession,
  requireMobileWorkspace,
  serializeId,
} from "@/lib/mobile/session";

function mapTransaction(item: Record<string, unknown>) {
  return {
    id: serializeId(item._id),
    type: item.type,
    amount: item.amount,
    transactionDate: item.transactionDate,
    description: item.description ?? "",
    notes: item.notes ?? "",
    accountId: serializeId(item.accountId),
    accountName: populatedName(item.accountId),
    categoryId: serializeId(item.categoryId),
    categoryName: populatedName(item.categoryId),
    clientId: item.clientId ? serializeId(item.clientId) : null,
    clientName: populatedName(item.clientId),
    projectId: item.projectId ? serializeId(item.projectId) : null,
    projectName: populatedName(item.projectId),
  };
}

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
    const result = await listTransactions(parsed.data);
    return NextResponse.json({
      items: result.items.map((item) => mapTransaction(item as unknown as Record<string, unknown>)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    });
  } catch (error) {
    return mobileErrorResponse(error);
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

    const id = await createTransaction(parsed.data, session.user.id);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return mobileErrorResponse(error);
  }
}
