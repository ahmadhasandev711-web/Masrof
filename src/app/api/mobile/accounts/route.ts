import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createAccountSchema } from "@/features/accounts/schemas";
import { accountsService } from "@/features/accounts/accounts.service";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { SupportedCurrency } from "@/models/workspace";
import {
  requireMobileSession,
  requireMobileWorkspace,
  serializeId,
} from "@/lib/mobile/session";
import { resultToResponse, thrownToMobileResponse } from "@/server/kernel";

export async function GET(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  const access = await requireMobileWorkspace(session.user.id, workspaceId, "read");
  if (access instanceof NextResponse) return access;

  const accounts = await accountsService.listForWorkspace(access.workspaceId);
  return NextResponse.json({
    items: accounts.map((account) => ({
      id: serializeId(account._id),
      name: account.name,
      type: account.type,
      currency: account.currency,
      balance: account.cachedBalance,
    })),
  });
}

export async function POST(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json();
    const parsed = createAccountSchema(() => "invalid").safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalidData" }, { status: 400 });
    }

    const access = await requireMobileWorkspace(session.user.id, parsed.data.workspaceId, "write");
    if (access instanceof NextResponse) return access;

    const result = await accountsService.create(
      session.user.id,
      parsed.data,
      access.workspace.currency as SupportedCurrency,
    );
    if (!result.ok) {
      return resultToResponse(result);
    }

    revalidateTag(CACHE_TAGS.accounts, "max");

    return NextResponse.json(
      {
        id: serializeId(result.value._id),
        name: result.value.name,
        type: result.value.type,
        currency: result.value.currency,
        balance: result.value.cachedBalance,
      },
      { status: 201 },
    );
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}
