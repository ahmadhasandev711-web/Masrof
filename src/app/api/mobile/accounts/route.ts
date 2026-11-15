import { NextResponse } from "next/server";
import { validationErrorCode } from "@/lib/mobile/validation";
import { revalidateTag } from "next/cache";
import { createAccountSchema } from "@/features/accounts/schemas";
import { accountsService } from "@/features/accounts/accounts.service";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { SupportedCurrency } from "@/models/workspace";
import { requireMobileSession, requireMobileWorkspace } from "@/lib/mobile/session";
import { toMobileAccount } from "@/lib/mobile/serialize";
import {
  mobileAccountPatchBodySchema,
  mobileAccountSchema,
  mobileAccountsListResponseSchema,
} from "@contracts/mobile/accounts";
import { mobileOkSchema } from "@contracts/mobile/common";
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
    // Translator = identity: the issue message is the `validation.*` key, which
    // the app turns into the same sentence the web shows.
    const parsed = createAccountSchema((key) => key).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: validationErrorCode(parsed.error) },
        { status: 400 },
      );
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

export async function PATCH(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const parsed = mobileAccountPatchBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "invalidData" }, { status: 400 });
    }

    const access = await requireMobileWorkspace(session.user.id, parsed.data.workspaceId, "write");
    if (access instanceof NextResponse) return access;

    const result = await accountsService.archive(parsed.data.accountId, access.workspaceId);
    if (!result.ok) return resultToResponse(result);

    revalidateTag(CACHE_TAGS.accounts, "max");
    return NextResponse.json(mobileOkSchema.parse({ ok: true }));
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}
