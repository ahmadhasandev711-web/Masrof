import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createAccountSchema } from "@/features/accounts/schemas";
import { accountsService } from "@/features/accounts/accounts.service";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { SupportedCurrency } from "@/models/workspace";
import { requireMobileSession, requireMobileWorkspace } from "@/lib/mobile/session";
import { toMobileAccount } from "@/lib/mobile/serialize";
import {
  mobileAccountSchema,
  mobileAccountsListResponseSchema,
} from "@contracts/mobile/accounts";
import { resultToResponse, thrownToMobileResponse } from "@/server/kernel";

export async function GET(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  const access = await requireMobileWorkspace(session.user.id, workspaceId, "read");
  if (access instanceof NextResponse) return access;

  const accounts = await accountsService.listForWorkspace(access.workspaceId);
  const body = mobileAccountsListResponseSchema.parse({
    items: accounts.map(toMobileAccount),
  });
  return NextResponse.json(body);
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

    return NextResponse.json(mobileAccountSchema.parse(toMobileAccount(result.value)), {
      status: 201,
    });
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}
