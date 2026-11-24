import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { validationErrorCode } from "@/lib/mobile/validation";
import { resolveCategoryLabel } from "@/features/categories/labels";
import { createBudgetSchema } from "@/features/budgets/schemas";
import { budgetsService } from "@/features/budgets/budgets.service";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { AppLocale } from "@/i18n/config";
import {
  requireMobileSession,
  requireMobileWorkspace,
  serializeId,
} from "@/lib/mobile/session";
import { toMobileBudget } from "@/lib/mobile/serialize";
import {
  mobileBudgetPatchBodySchema,
  mobileBudgetsListResponseSchema,
} from "@contracts/mobile/budgets";
import { mobileOkSchema } from "@contracts/mobile/common";
import { requirePlanFeature } from "@/server/kernel/plan-policy";
import { resultToResponse, thrownToMobileResponse } from "@/server/kernel";

type PopulatedCategory = {
  _id?: unknown;
  name?: string;
  nameEn?: string | null;
  icon?: string | null;
};

export async function GET(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  const locale: AppLocale = url.searchParams.get("locale") === "en" ? "en" : "ar";
  const access = await requireMobileWorkspace(session.user.id, workspaceId, "read");
  if (access instanceof NextResponse) return access;

  const feature = await requirePlanFeature(session.user.id, access.workspaceId, "budgets");
  if (!feature.ok) return resultToResponse(feature);

  const budgets = await budgetsService.listWithProgress(access.workspaceId);
  return NextResponse.json(
    mobileBudgetsListResponseSchema.parse({
      items: budgets.map((budget) => {
        const category = budget.categoryId as PopulatedCategory | null;
        return toMobileBudget({
          _id: budget._id,
          name: budget.name,
          amount: budget.amount,
          spent: budget.spent,
          remaining: budget.remaining,
          percentage: budget.percentage,
          conversionIncomplete: budget.conversionIncomplete,
          categoryId: category?._id ?? null,
          categoryName: category?.name
            ? resolveCategoryLabel({ name: category.name, nameEn: category.nameEn }, locale)
            : null,
          categoryIcon: category?.icon ?? null,
        });
      }),
    }),
  );
}

export async function POST(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const parsed = createBudgetSchema((key) => key).safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: validationErrorCode(parsed.error) }, { status: 400 });
    }

    const access = await requireMobileWorkspace(session.user.id, parsed.data.workspaceId, "write");
    if (access instanceof NextResponse) return access;

    const result = await budgetsService.create(session.user.id, parsed.data);
    if (!result.ok) return resultToResponse(result);

    revalidateTag(CACHE_TAGS.budgets, "max");
    revalidatePath("/dashboard/budgets");
    return NextResponse.json({ id: serializeId(result.value._id) }, { status: 201 });
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}

/** Archive a budget through the same `budgetsService.archive` the web uses. */
export async function PATCH(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const parsed = mobileBudgetPatchBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "invalidData" }, { status: 400 });
    }

    const access = await requireMobileWorkspace(session.user.id, parsed.data.workspaceId, "write");
    if (access instanceof NextResponse) return access;

    const feature = await requirePlanFeature(session.user.id, access.workspaceId, "budgets");
    if (!feature.ok) return resultToResponse(feature);

    const result = await budgetsService.archive(parsed.data.budgetId, access.workspaceId);
    if (!result.ok) return resultToResponse(result);

    revalidateTag(CACHE_TAGS.budgets, "max");
    revalidatePath("/dashboard/budgets");
    return NextResponse.json(mobileOkSchema.parse({ ok: true }));
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}
