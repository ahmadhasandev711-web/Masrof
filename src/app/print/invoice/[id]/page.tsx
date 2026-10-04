import { notFound } from "next/navigation";
import { ClientRedirect } from "@/components/client-redirect";
import { requireSession } from "@/features/auth/session";
import { getActiveWorkspaceForPage } from "@/features/workspaces/page-gate";
import { assertWorkspacePlanFeature } from "@/features/subscriptions/data";
import { getInvoiceForPrint } from "@/features/invoices/data";
import { parseInvoicePrintFormat } from "@/features/invoices/constants";
import { InvoicePrintToolbar } from "@/features/invoices/components/invoice-print-toolbar";
import { InvoicePrintDocument } from "@/features/invoices/components/invoice-print-document";
import { InvoicePrintFormatSync } from "@/features/invoices/components/invoice-print-format-sync";
import "../invoice-print.css";

type SearchParams = Record<string, string | undefined>;

export default async function PrintInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireSession();
  const { activeWorkspace, redirect: onboardingRedirect } = await getActiveWorkspaceForPage(
    session.user.id,
  );
  if (onboardingRedirect) return onboardingRedirect;
  const workspaceId = activeWorkspace._id.toString();


  const clientsError = await assertWorkspacePlanFeature(
    session.user.id,
    workspaceId,
    "clientsAndProjects",
  );
  if (clientsError) {
    return <ClientRedirect href="/dashboard/invoices?upgrade=clients" />;
  }

  const { id } = await params;
  const rawParams = await searchParams;
  const format = parseInvoicePrintFormat(rawParams.format);

  const invoice = await getInvoiceForPrint(id, workspaceId, {
    name: activeWorkspace.name,
    businessName: activeWorkspace.businessName,
    logoUrl: activeWorkspace.logoUrl,
    taxId: activeWorkspace.taxId,
    businessPhone: activeWorkspace.businessPhone,
    businessAddress: activeWorkspace.businessAddress,
    currency: activeWorkspace.currency,
  });

  if (!invoice) {
    notFound();
  }

  return (
    <main className="invoice-print-page text-neutral-900">
      <InvoicePrintFormatSync format={format} />
      <div className="mx-auto w-fit max-w-full">
        <InvoicePrintToolbar invoiceId={id} format={format} />
        <InvoicePrintDocument invoice={invoice} format={format} />
      </div>
    </main>
  );
}
