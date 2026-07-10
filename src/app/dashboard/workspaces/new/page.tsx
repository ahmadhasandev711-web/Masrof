import Link from "next/link";
import { requireSession } from "@/features/auth/session";
import { CreateWorkspaceForm } from "@/features/workspaces/components/create-workspace-form";
import { getTranslations } from "next-intl/server";

export default async function NewWorkspacePage() {
  await requireSession();
  const t = await getTranslations("pages.newWorkspace");

  return (
    <div className="mx-auto max-w-md">
      <Link href="/dashboard" className="text-sm text-neutral-400 hover:text-neutral-600">
        {t("back")}
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-neutral-900">{t("title")}</h1>
      <p className="mt-1 text-sm text-neutral-500">{t("subtitle")}</p>

      <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <CreateWorkspaceForm mode="new" />
      </div>
    </div>
  );
}
