import { getTranslations } from "next-intl/server";
import { getHomepageContentForAdmin } from "@/features/marketing/content/data";
import { HomepageContentForm } from "@/features/admin/components/homepage-content-form";

export default async function AdminSitePage() {
  const t = await getTranslations("admin.site");
  const content = await getHomepageContentForAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-neutral-500">{t("subtitle")}</p>
      </div>

      <HomepageContentForm content={content} />
    </div>
  );
}
