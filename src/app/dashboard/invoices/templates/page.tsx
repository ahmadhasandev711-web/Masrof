import Link from "next/link";
import { requireSession } from "@/features/auth/session";
import { getActiveWorkspaceForPage } from "@/features/workspaces/page-gate";
import { canWorkspaceWrite, getWorkspaceAccess } from "@/features/workspaces/access";
import { getWorkspacePlanContext } from "@/features/subscriptions/data";
import { invoiceTemplatesService } from "@/features/invoices/invoice-templates.service";
import { InvoiceTemplatesManager } from "@/features/invoices/components/invoice-templates-manager";
import { getTranslations } from "next-intl/server";

export default async function InvoiceTemplatesPage() {
  const session = await requireSession();
  const t = await getTranslations("pages.invoiceTemplates");
  const tInvoices = await getTranslations("pages.invoices");
  const { activeWorkspace, redirect } = await getActiveWorkspaceForPage(session.user.id);
  if (redirect) return redirect;

  const workspaceId = activeWorkspace._id.toString();
  const [access, planCtx, templates] = await Promise.all([
    getWorkspaceAccess(session.user.id, workspaceId),
    getWorkspacePlanContext(session.user.id, workspaceId),
    invoiceTemplatesService.listForWorkspace(workspaceId),
  ]);

  const canWrite =
    canWorkspaceWrite(access.membership.role) && planCtx.plan.clientsAndProjects;

  return (
    <div className="flex w-full max-w-5xl flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/dashboard/invoices"
            className="text-xs font-medium text-emerald-700 hover:underline"
          >
            ← {tInvoices("title")}
          </Link>
          <h1 className="mt-1 text-xl font-bold text-neutral-900 sm:text-2xl">{t("title")}</h1>
          <p className="mt-0.5 text-sm text-neutral-500">{t("subtitle")}</p>
        </div>
      </div>

      <InvoiceTemplatesManager
        workspaceId={workspaceId}
        templates={templates}
        canWrite={canWrite}
      />
    </div>
  );
}
