import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { listAccountsForWorkspace, createAccount } from "@/features/accounts/data";
import { resolveAccountCurrency } from "@/lib/currency";
import { createAccountSchema } from "@/features/accounts/schemas";
import { assertWorkspacePlanFeature } from "@/features/subscriptions/data";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { SupportedCurrency } from "@/models/workspace";
import {
  mobileErrorResponse,
  requireMobileSession,
  requireMobileWorkspace,
  serializeId,
} from "@/lib/mobile/session";

export async function GET(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  const access = await requireMobileWorkspace(session.user.id, workspaceId, "read");
  if (access instanceof NextResponse) return access;

  const accounts = await listAccountsForWorkspace(access.workspaceId);
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

    const workspaceCurrency = access.workspace.currency as SupportedCurrency;
    const requestedCurrency = resolveAccountCurrency(parsed.data.currency, workspaceCurrency);

    if (requestedCurrency !== workspaceCurrency) {
      const featureError = await assertWorkspacePlanFeature(
        session.user.id,
        parsed.data.workspaceId,
        "multiCurrency",
      );
      if (featureError) {
        return NextResponse.json({ error: featureError }, { status: 403 });
      }
    }

    const account = await createAccount(
      { ...parsed.data, currency: requestedCurrency },
      workspaceCurrency,
    );

    revalidateTag(CACHE_TAGS.accounts, "max");

    return NextResponse.json({
      id: serializeId(account._id),
      name: account.name,
      type: account.type,
      currency: account.currency,
      balance: account.cachedBalance,
    });
  } catch (error) {
    return mobileErrorResponse(error);
  }
}
