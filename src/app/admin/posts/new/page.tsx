import { getTranslations } from "next-intl/server";
import { PostEditorForm } from "@/features/admin/components/post-editor-form";

export default async function AdminNewPostPage() {
  const t = await getTranslations("admin.posts");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">{t("new")}</h1>
        <p className="mt-1 text-sm text-neutral-500">{t("markdownHint")}</p>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <PostEditorForm />
      </div>
    </div>
  );
}
