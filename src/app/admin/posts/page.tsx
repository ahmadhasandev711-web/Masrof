import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { listAllPosts } from "@/features/admin/data";

export default async function AdminPostsPage() {
  const [t, format] = await Promise.all([
    getTranslations("admin.posts"),
    getFormatter(),
  ]);
  const posts = await listAllPosts();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">{t("title")}</h1>
          <p className="mt-1 text-sm text-neutral-500">{t("count", { count: posts.length })}</p>
        </div>
        <Link
          href="/admin/posts/new"
          className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-medium text-white hover:bg-violet-800"
        >
          {t("new")}
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-right text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">{t("fields.locale")}</th>
              <th className="px-4 py-3 font-medium">{t("fields.title")}</th>
              <th className="px-4 py-3 font-medium">{t("status")}</th>
              <th className="px-4 py-3 font-medium">{t("updatedAt")}</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {posts.map((post) => (
              <tr key={String(post._id)} className="hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium uppercase text-neutral-600">
                    {post.locale === "en" ? "EN" : "AR"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-neutral-900">{post.title}</p>
                  <p className="text-xs text-neutral-400" dir="ltr">
                    /blog/{post.slug}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      post.isPublished
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {post.isPublished ? t("published") : t("draft")}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-500">
                  {post.updatedAt
                    ? format.dateTime(new Date(post.updatedAt), {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/posts/${String(post._id)}/edit`}
                    className="text-violet-700 hover:underline"
                  >
                    {t("edit")}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {posts.length === 0 && (
          <p className="px-4 py-10 text-center text-neutral-400">{t("empty")}</p>
        )}
      </div>
    </div>
  );
}
