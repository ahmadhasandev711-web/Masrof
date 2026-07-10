import Link from "next/link";
import { requireSession } from "@/features/auth/session";
import { getCurrentWorkspaceContext } from "@/features/workspaces/current";
import { listClientsForWorkspace } from "@/features/clients/data";
import { listInvoicesForWorkspace } from "@/features/invoices/data";
import { getWorkspacePlanContext } from "@/features/subscriptions/data";
import { CreateInvoiceForm } from "@/features/invoices/components/create-invoice-form";
import { InvoiceList } from "@/features/invoices/components/invoice-list";
import { getTranslations } from "next-intl/server";

type SearchParams = Record<string, string | undefined>;

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireSession();
  const t = await getTranslations("pages.invoices");
  const tDashboard = await getTranslations("dashboard");
  const tPlan = await getTranslations("dashboard.plan");
  const { activeWorkspace } = await getCurrentWorkspaceContext(session.user.id);
  const workspaceId = activeWorkspace._id.toString();
  const { plan } = await getWorkspacePlanContext(session.user.id, workspaceId);
  const rawParams = await searchParams;
  const defaultClientId = rawParams.clientId;

  const [clients, invoices] = await Promise.all([
    listClientsForWorkspace(workspaceId),
    listInvoicesForWorkspace(workspaceId),
  ]);

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">{t("title")}</h1>
        <p className="text-sm text-neutral-500">{activeWorkspace.name}</p>
      </div>

      {plan.clientsAndProjects ? (
        <>
          <CreateInvoiceForm
            workspaceId={workspaceId}
            clients={clients}
            defaultClientId={defaultClientId}
          />
          <InvoiceList invoices={invoices} currency={activeWorkspace.currency} />
        </>
      ) : (
        <div className="rounded-xl border border-[#065F46]/15 bg-[#ECFDF5]/50 p-4 text-sm text-[#1C1B1A]/70">
          {tDashboard("featureGate.clientsProjects")}{" "}
          <Link href="/pricing" className="font-medium text-[#065F46] hover:underline">
            {tPlan("viewPricing")}
          </Link>
          .
        </div>
      )}
    </div>
  );
}
