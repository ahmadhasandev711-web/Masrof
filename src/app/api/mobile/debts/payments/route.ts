import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { validationErrorCode } from "@/lib/mobile/validation";
import { recordDebtPaymentSchema } from "@/features/debts/schemas";
import { debtsService } from "@/features/debts/debts.service";
import type { AppLocale } from "@/i18n/config";
import { CACHE_TAGS } from "@/lib/cache-tags";
import {
  requireMobileSession,
  requireMobileWorkspace,
} from "@/lib/mobile/session";
import { mobileDebtPaymentCreatedSchema, mobileDebtPaymentsResponseSchema } from "@contracts/mobile/debts";
import { resultToResponse, thrownToMobileResponse } from "@/server/kernel";

export async function GET(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  const debtId = url.searchParams.get("debtId");

  if (!debtId) {
    return NextResponse.json({ error: "invalidData" }, { status: 400 });
  }

  const access = await requireMobileWorkspace(session.user.id, workspaceId, "read");
  if (access instanceof NextResponse) return access;

  const feature = await debtsService.requireAccess(session.user.id, access.workspaceId);
  if (!feature.ok) return resultToResponse(feature);

  try {
    const items = await debtsService.listPayments(access.workspaceId, debtId);
    return NextResponse.json(
      mobileDebtPaymentsResponseSchema.parse({
        items: items.map((item) => ({
          id: item.id,
          amount: item.amount,
          paymentDate: item.paymentDate,
          accountName: item.accountName,
          reference: item.reference,
          notes: item.notes,
        })),
      }),
    );
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}

export async function POST(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const url = new URL(request.url);
  const locale: AppLocale = url.searchParams.get("locale") === "en" ? "en" : "ar";

  try {
    const parsed = recordDebtPaymentSchema((key) => key).safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: validationErrorCode(parsed.error) }, { status: 400 });
    }

    const access = await requireMobileWorkspace(session.user.id, parsed.data.workspaceId, "write");
    if (access instanceof NextResponse) return access;

    const result = await debtsService.recordPayment(session.user.id, parsed.data, locale);
    if (!result.ok) return resultToResponse(result);

    revalidateTag(CACHE_TAGS.accounts, "max");
    revalidatePath("/dashboard/debts");
    revalidatePath("/dashboard/transactions");
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard");
    return NextResponse.json(mobileDebtPaymentCreatedSchema.parse(result.value), { status: 201 });
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}
