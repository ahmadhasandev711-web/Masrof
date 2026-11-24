import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { validationErrorCode } from "@/lib/mobile/validation";
import { createRecurringExpenseSchema } from "@/features/recurring-expenses/schemas";
import { recurringExpensesService } from "@/features/recurring-expenses/recurring-expenses.service";
import { getEffectiveSubscriptionForWorkspace } from "@/features/subscriptions/data";
import { getPlanQuantityLimit } from "@/features/subscriptions/plan-config-data";
import {
  countRecurringExpensesForWorkspace,
  toQuantityUsage,
} from "@/features/subscriptions/plan-usage";
import { getUserWhatsAppPhone } from "@/features/whatsapp/data";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { AppLocale } from "@/i18n/config";
import {
  requireMobileSession,
  requireMobileWorkspace,
  serializeId,
} from "@/lib/mobile/session";
import {
  mobileRecurringArchiveBodySchema,
  mobileRecurringListResponseSchema,
  mobileRecurringRecordBodySchema,
} from "@contracts/mobile/recurring";
import { mobileOkSchema } from "@contracts/mobile/common";
import { requirePlanFeature } from "@/server/kernel/plan-policy";
import { resultToResponse, thrownToMobileResponse } from "@/server/kernel";

function revalidateRecurring() {
  revalidateTag(CACHE_TAGS.recurring, "max");
  revalidatePath("/dashboard/budgets");
}

export async function GET(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  const access = await requireMobileWorkspace(session.user.id, workspaceId, "read");
  if (access instanceof NextResponse) return access;

  const feature = await requirePlanFeature(session.user.id, access.workspaceId, "recurringExpenses");
  if (!feature.ok) return resultToResponse(feature);

  try {
    const [items, used, subscription, whatsappPhone] = await Promise.all([
      recurringExpensesService.listForWorkspace(access.workspaceId),
      countRecurringExpensesForWorkspace(access.workspaceId),
      getEffectiveSubscriptionForWorkspace(session.user.id, access.workspaceId),
      getUserWhatsAppPhone(session.user.id),
    ]);
    const limit = await getPlanQuantityLimit(subscription.plan, "maxRecurringExpenses");
    return NextResponse.json(
      mobileRecurringListResponseSchema.parse({
        items: items.map((item) => ({
          id: item.id,
          amount: item.amount,
          description: item.description,
          frequency: item.frequency,
          nextDueDate: item.nextDueDate,
          accountName: item.accountName,
          categoryName: item.categoryName,
          categoryNameEn: item.categoryNameEn,
          categorySlug: item.categorySlug,
        })),
        usage: toQuantityUsage(used, limit),
        whatsappPhone,
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
    const parsed = createRecurringExpenseSchema((key) => key).safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: validationErrorCode(parsed.error) }, { status: 400 });
    }

    const access = await requireMobileWorkspace(session.user.id, parsed.data.workspaceId, "write");
    if (access instanceof NextResponse) return access;

    const result = await recurringExpensesService.create(session.user.id, parsed.data);
    if (!result.ok) return resultToResponse(result);

    revalidateRecurring();
    return NextResponse.json({ id: serializeId(result.value._id) }, { status: 201 });
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}

/** Record the due expense, or stop the schedule. Both go through `recurringExpensesService`. */
export async function PATCH(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const url = new URL(request.url);
    const locale: AppLocale = url.searchParams.get("locale") === "en" ? "en" : "ar";
    const body = await request.json();
    const action = body && typeof body === "object" ? (body as { action?: unknown }).action : undefined;

    if (action === "archive") {
      const parsed = mobileRecurringArchiveBodySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "invalidData" }, { status: 400 });
      }
      const access = await requireMobileWorkspace(session.user.id, parsed.data.workspaceId, "write");
      if (access instanceof NextResponse) return access;

      const result = await recurringExpensesService.archive(
        session.user.id,
        parsed.data.recurringId,
        access.workspaceId,
      );
      if (!result.ok) return resultToResponse(result);

      revalidateRecurring();
      return NextResponse.json(mobileOkSchema.parse({ ok: true }));
    }

    if (action === "record") {
      const parsed = mobileRecurringRecordBodySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "invalidData" }, { status: 400 });
      }
      const access = await requireMobileWorkspace(session.user.id, parsed.data.workspaceId, "write");
      if (access instanceof NextResponse) return access;

      const result = await recurringExpensesService.record(
        parsed.data.recurringId,
        access.workspaceId,
        session.user.id,
        locale,
      );
      if (!result.ok) return resultToResponse(result);

      revalidateRecurring();
      revalidateTag(CACHE_TAGS.budgets, "max");
      revalidateTag(CACHE_TAGS.accounts, "max");
      revalidatePath("/dashboard/transactions");
      revalidatePath("/dashboard/accounts");
      revalidatePath("/dashboard");
      return NextResponse.json(mobileOkSchema.parse({ ok: true }));
    }

    return NextResponse.json({ error: "invalidData" }, { status: 400 });
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}
