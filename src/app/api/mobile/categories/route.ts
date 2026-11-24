import { NextResponse } from "next/server";
import { validationErrorCode } from "@/lib/mobile/validation";
import { revalidateTag } from "next/cache";
import { createCategorySchema, createUpdateCategorySchema } from "@/features/categories/schemas";
import { categoriesService } from "@/features/categories/categories.service";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { CategoryKind } from "@/models/category";
import { requireMobileSession, requireMobileWorkspace } from "@/lib/mobile/session";
import { toMobileCategory } from "@/lib/mobile/serialize";
import {
  mobileCategoriesListResponseSchema,
  mobileCategoryCreatedSchema,
  mobileCategoryPatchBodySchema,
} from "@contracts/mobile/categories";
import { mobileOkSchema } from "@contracts/mobile/common";
import { resultToResponse, thrownToMobileResponse } from "@/server/kernel";
import { resolveCategoryLabel } from "@/features/categories/labels";
import type { AppLocale } from "@/i18n/config";

export async function GET(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  const kind = url.searchParams.get("kind") as CategoryKind | null;
  const access = await requireMobileWorkspace(session.user.id, workspaceId, "read");
  if (access instanceof NextResponse) return access;

  const localeParam = url.searchParams.get("locale");
  const locale: AppLocale = localeParam === "en" ? "en" : "ar";

  const categories = await categoriesService.listForWorkspace(
    access.workspaceId,
    kind === "income" || kind === "expense" ? kind : undefined,
  );

  const body = mobileCategoriesListResponseSchema.parse({
    items: categories.map((category) =>
      toMobileCategory({
        ...category,
        displayName: resolveCategoryLabel(
          { name: category.name, nameEn: category.nameEn },
          locale,
        ),
      }),
    ),
  });
  return NextResponse.json(body);
}

export async function POST(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json();
    // Identity translator: the issue message is the `validation.*` key the app translates.
    const parsed = createCategorySchema((key) => key).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: validationErrorCode(parsed.error) },
        { status: 400 },
      );
    }

    const access = await requireMobileWorkspace(session.user.id, parsed.data.workspaceId, "write");
    if (access instanceof NextResponse) return access;

    const result = await categoriesService.create(session.user.id, parsed.data);
    if (!result.ok) {
      return resultToResponse(result);
    }

    revalidateTag(CACHE_TAGS.categories, "max");
    return NextResponse.json(
      mobileCategoryCreatedSchema.parse(toMobileCategory(result.value)),
      { status: 201 },
    );
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}

export async function PATCH(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const parsed = mobileCategoryPatchBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "invalidData" }, { status: 400 });
    }

    const access = await requireMobileWorkspace(session.user.id, parsed.data.workspaceId, "write");
    if (access instanceof NextResponse) return access;

    if (parsed.data.action === "update") {
      const input = createUpdateCategorySchema((key) => key).safeParse({
        ...parsed.data,
        workspaceId: access.workspaceId,
      });
      if (!input.success) {
        return NextResponse.json({ error: validationErrorCode(input.error) }, { status: 400 });
      }
      const result = await categoriesService.update(input.data.categoryId, access.workspaceId, {
        name: input.data.name,
        nameEn: input.data.nameEn,
      });
      if (!result.ok) return resultToResponse(result);
    } else {
      const result = await categoriesService.archive(parsed.data.categoryId, access.workspaceId);
      if (!result.ok) return resultToResponse(result);
    }

    revalidateTag(CACHE_TAGS.categories, "max");
    return NextResponse.json(mobileOkSchema.parse({ ok: true }));
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}
