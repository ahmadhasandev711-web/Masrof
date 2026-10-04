import Link from "next/link";
import { requireSession } from "@/features/auth/session";
import { CreateWorkspaceForm } from "@/features/workspaces/components/create-workspace-form";
import { assertCanCreateWorkspace } from "@/features/subscriptions/data";
import { countOwnedWorkspacesForUser } from "@/features/workspaces/members-data";
import { getTranslations } from "next-intl/server";

export default async function NewWorkspacePage() {
  const session = await requireSession();
  const ownedCount = await countOwnedWorkspacesForUser(session.user.id);
  const limitError = await assertCanCreateWorkspace(session.user.id);

  const t = await getTranslations("pages.newWorkspace");

  return (
    <div className="mx-auto max-w-md">
      <Link href="/dashboard" className="text-sm text-neutral-400 hover:text-neutral-600 transition">
        {t("back")}
      </Link>
      <h1 className="mt-2 text-xl font-bold text-neutral-900">{t("title")}</h1>
      <p className="mt-1 text-sm text-neutral-500">{t("subtitle")}</p>

      <div className="mt-6 flex flex-col gap-4">
        {limitError ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900 shadow-sm">
            <p className="font-semibold">{limitError}</p>
            <p className="mt-1 text-xs text-amber-700">{t("maxLimitReached")}</p>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-3.5 text-xs text-emerald-900 shadow-2xs">
              <span className="text-base select-none">💡</span>
              <p className="leading-relaxed">
                {t("freeNotice")}
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <CreateWorkspaceForm mode="new" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
