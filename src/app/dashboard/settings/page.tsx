import Link from "next/link";
import { requireSession } from "@/features/auth/session";
import { getActiveWorkspaceForPage } from "@/features/workspaces/page-gate";
import { getWorkspaceAccess } from "@/features/workspaces/access";
import { WorkspaceBrandingForm } from "@/features/workspaces/components/workspace-branding-form";
import { WorkspaceCurrencyForm } from "@/features/workspaces/components/workspace-currency-form";
import type { SupportedCurrency } from "@/models/workspace";
import { getTranslations } from "next-intl/server";

export default async function WorkspaceSettingsPage() {
  const session = await requireSession();
  const t = await getTranslations("pages.settings");
  const { activeWorkspace, redirect } = await getActiveWorkspaceForPage(session.user.id);
  if (redirect) return redirect;

  const workspaceId = activeWorkspace._id.toString();
  const access = await getWorkspaceAccess(session.user.id, workspaceId);
  const isOwner = access.membership.role === "owner";

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">{t("title")}</h1>
          <p className="text-sm text-neutral-500">{activeWorkspace.name}</p>
        </div>
      </div>

      {isOwner ? (
        <>
          <WorkspaceCurrencyForm
            workspaceId={workspaceId}
            currentCurrency={(activeWorkspace.currency as SupportedCurrency) || "EGP"}
          />
          <WorkspaceBrandingForm
            workspaceId={workspaceId}
            initial={{
              businessName: activeWorkspace.businessName ?? "",
              logoUrl: activeWorkspace.logoUrl ?? "",
              taxId: activeWorkspace.taxId ?? "",
              businessPhone: activeWorkspace.businessPhone ?? "",
              businessAddress: activeWorkspace.businessAddress ?? "",
            }}
          />
        </>
      ) : (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t("ownerOnly")}
        </p>
      )}
    </div>
  );
}
