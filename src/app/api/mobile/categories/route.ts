import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createCategorySchema } from "@/features/categories/schemas";
import { categoriesService } from "@/features/categories/categories.service";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { CategoryKind } from "@/models/category";
import {
  requireMobileSession,
  requireMobileWorkspace,
  serializeId,
} from "@/lib/mobile/session";
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

  return NextResponse.json({
    items: categories.map((category) => ({
      id: serializeId(category._id),
      name: category.name,
      nameEn: category.nameEn ?? null,
      displayName: resolveCategoryLabel(
        { name: category.name, nameEn: category.nameEn },
        locale,
      ),
      slug: category.slug ?? null,
      kind: category.kind,
      icon: category.icon ?? null,
      isSystem: Boolean(category.isSystem),
    })),
  });
}

export async function POST(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json();
    const parsed = createCategorySchema(() => "invalid").safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalidData" }, { status: 400 });
    }

    const access = await requireMobileWorkspace(session.user.id, parsed.data.workspaceId, "write");
    if (access instanceof NextResponse) return access;

    const result = await categoriesService.create(session.user.id, parsed.data);
    if (!result.ok) {
      return resultToResponse(result);
    }

    revalidateTag(CACHE_TAGS.categories, "max");
    return NextResponse.json(
      {
        id: serializeId(result.value._id),
        name: result.value.name,
        nameEn: result.value.nameEn ?? null,
        kind: result.value.kind,
      },
      { status: 201 },
    );
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}
