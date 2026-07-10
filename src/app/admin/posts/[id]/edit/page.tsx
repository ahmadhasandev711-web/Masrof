import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getPostById } from "@/features/admin/data";
import { PostEditorForm } from "@/features/admin/components/post-editor-form";
import { deletePostAction } from "@/features/admin/actions/posts";

export default async function AdminEditPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const t = await getTranslations("admin.posts");
  const { id } = await params;
  const { created } = await searchParams;
  const post = await getPostById(id);

  if (!post) notFound();

  const deleteBound = deletePostAction.bind(null, id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">{t("edit")}</h1>
          {created === "1" && (
            <p className="mt-1 text-sm text-emerald-700">{t("createdSuccess")}</p>
          )}
        </div>
        <form action={deleteBound}>
          <button
            type="submit"
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
          >
            {t("delete")}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <PostEditorForm
          post={{
            id,
            locale: (post.locale === "en" ? "en" : "ar") as "ar" | "en",
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            content: post.content,
            isPublished: post.isPublished,
            featuredImageUrl: post.featuredImage?.url ?? undefined,
            featuredImageAlt: post.featuredImage?.alt ?? undefined,
            category: post.category ?? undefined,
            tags: Array.isArray(post.tags) ? post.tags.map(String) : [],
          }}
        />
      </div>
    </div>
  );
}
