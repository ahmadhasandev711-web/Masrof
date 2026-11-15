import { NextResponse } from "next/server";
import { invoicesService } from "@/features/invoices/invoices.service";
import { requireMobileSession, requireMobileWorkspace } from "@/lib/mobile/session";
import { toMobileInvoice } from "@/lib/mobile/serialize";
import { mobileInvoiceDetailResponseSchema } from "@contracts/mobile/invoices";
import { thrownToMobileResponse } from "@/server/kernel";

/** One invoice (same mapping as the list) plus its payment history. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  const access = await requireMobileWorkspace(session.user.id, workspaceId, "read");
  if (access instanceof NextResponse) return access;

  try {
    const invoice = await invoicesService.getListItem(id, access.workspaceId);
    if (!invoice) {
      return NextResponse.json({ error: "invoiceNotFound" }, { status: 404 });
    }
    const payments = await invoicesService.listPayments(id, access.workspaceId);

    return NextResponse.json(
      mobileInvoiceDetailResponseSchema.parse({
        invoice: toMobileInvoice(invoice as unknown as Record<string, unknown>),
        payments: payments.map((p) => ({
          id: p._id,
          accountId: p.accountId,
          accountName: p.accountName ?? "",
          amount: p.amount,
          paymentDate: p.paymentDate,
          paymentMethod: p.paymentMethod,
          reference: p.reference,
          notes: p.notes,
        })),
      }),
    );
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}
