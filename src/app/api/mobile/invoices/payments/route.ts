import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { recordPaymentSchema } from "@/features/invoices/payment-schemas";
import { invoicesService } from "@/features/invoices/invoices.service";
import { CACHE_TAGS } from "@/lib/cache-tags";
import {
  requireMobileSession,
  requireMobileWorkspace,
  serializeId,
} from "@/lib/mobile/session";
import { mobileInvoicePaymentCreatedSchema } from "@contracts/mobile/invoices";
import { resultToResponse, thrownToMobileResponse } from "@/server/kernel";

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

    const result = await invoicesService.recordPayment(session.user.id, parsed.data);
    if (!result.ok) {
      return resultToResponse(result);
    }

    revalidateTag(CACHE_TAGS.invoices, "max");
    revalidateTag(CACHE_TAGS.accounts, "max");

    const payment = result.value;
    const paymentId =
      payment && typeof payment === "object" && "_id" in payment
        ? serializeId((payment as { _id: unknown })._id)
        : "";
    return NextResponse.json(
      mobileInvoicePaymentCreatedSchema.parse({ paymentId }),
      { status: 201 },
    );
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}
