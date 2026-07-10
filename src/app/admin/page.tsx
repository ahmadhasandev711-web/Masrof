import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getAdminStats } from "@/features/admin/data";

export default async function AdminOverviewPage() {
  const t = await getTranslations("admin.overview");
  const stats = await getAdminStats();

  const cards = [
    {
      label: t("posts"),
      value: stats.postsTotal,
      hint: t("postsPublished", { count: stats.postsPublished }),
    },
    { label: t("users"), value: stats.usersTotal, hint: t("usersHint") },
    { label: t("subscribers"), value: stats.subscribersActive, hint: t("subscribersHint") },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-neutral-500">{t("subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm text-neutral-500">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-neutral-900">{card.value}</p>
            <p className="mt-1 text-xs text-neutral-400">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="font-medium text-neutral-900">{t("quickActions")}</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/admin/posts/new"
            className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-medium text-white hover:bg-violet-800"
          >
            {t("newPost")}
          </Link>
          <Link
            href="/admin/posts"
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            {t("allPosts")}
          </Link>
          <Link
            href="/admin/site"
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            {t("siteContent")}
          </Link>
          <Link
            href="/admin/subscribers"
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            {t("subscribers")}
          </Link>
        </div>
      </div>
    </div>
  );
}
