import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { recordPaymentSchema } from "@/features/invoices/payment-schemas";
import {
  recordInvoicePayment,
  InvoiceOverpaymentError,
  InvoiceCancelledError,
  AccountCurrencyMismatchError,
  InvalidPaymentReferenceError,
} from "@/features/invoices/payment-data";
import { CACHE_TAGS } from "@/lib/cache-tags";
import {
  mobileErrorResponse,
  requireMobileSession,
  requireMobileWorkspace,
  serializeId,
} from "@/lib/mobile/session";

export async function POST(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json();
    const parsed = recordPaymentSchema(() => "invalid").safeParse({
      workspaceId: body.workspaceId,
      invoiceId: body.invoiceId,
      accountId: body.accountId,
      categoryId: body.categoryId ?? null,
      amount: body.amount,
      paymentDate: body.paymentDate,
      paymentMethod: body.paymentMethod ?? "bank_transfer",
      reference: body.reference ?? "",
      notes: body.notes ?? "",
      idempotencyKey: body.idempotencyKey,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "invalidData" }, { status: 400 });
    }

    const access = await requireMobileWorkspace(session.user.id, parsed.data.workspaceId, "write");
    if (access instanceof NextResponse) return access;

    const payment = await recordInvoicePayment(parsed.data, session.user.id);

    revalidateTag(CACHE_TAGS.invoices, "max");
    revalidateTag(CACHE_TAGS.accounts, "max");
    revalidateTag(CACHE_TAGS.transactions, "max");

    const paymentId =
      payment && typeof payment === "object" && "_id" in payment
        ? serializeId((payment as { _id: unknown })._id)
        : "";
    return NextResponse.json({ paymentId }, { status: 201 });
  } catch (error) {
    if (error instanceof InvoiceOverpaymentError) {
      return NextResponse.json({ error: error.code }, { status: 400 });
    }
    if (error instanceof InvoiceCancelledError) {
      return NextResponse.json({ error: error.code }, { status: 400 });
    }
    if (error instanceof AccountCurrencyMismatchError) {
      return NextResponse.json({ error: error.code }, { status: 400 });
    }
    if (error instanceof InvalidPaymentReferenceError) {
      return NextResponse.json({ error: error.code }, { status: 400 });
    }
    return mobileErrorResponse(error);
  }
}
