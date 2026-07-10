import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/features/auth/session";
import { getCurrentWorkspaceContext } from "@/features/workspaces/current";
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
  const { activeWorkspace } = await getCurrentWorkspaceContext(session.user.id);
  const workspaceId = activeWorkspace._id.toString();

  const pdfError = await assertWorkspacePlanFeature(session.user.id, workspaceId, "pdfExport");
  if (pdfError) {
    redirect("/dashboard/invoices?upgrade=pdf");
  }

  const clientsError = await assertWorkspacePlanFeature(
    session.user.id,
    workspaceId,
    "clientsAndProjects",
  );
  if (clientsError) {
    redirect("/dashboard/invoices?upgrade=clients");
  }

  const { id } = await params;
  const rawParams = await searchParams;
  const format = parseInvoicePrintFormat(rawParams.format);

  const invoice = await getInvoiceForPrint(
    id,
    workspaceId,
    activeWorkspace.name,
    activeWorkspace.currency,
  );

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
