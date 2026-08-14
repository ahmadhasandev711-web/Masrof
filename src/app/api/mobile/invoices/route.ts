import { NextResponse } from "next/server";
import {
  createInvoice,
  listInvoicesForWorkspace,
  updateInvoiceStatus,
} from "@/features/invoices/data";
import { createInvoiceSchema } from "@/features/invoices/schemas";
import { INVOICE_STATUSES } from "@/models/invoice";
import {
  mobileErrorResponse,
  requireMobileSession,
  requireMobileWorkspace,
  serializeId,
} from "@/lib/mobile/session";

export async function GET(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  const access = await requireMobileWorkspace(session.user.id, workspaceId, "read");
  if (access instanceof NextResponse) return access;

  const items = await listInvoicesForWorkspace(access.workspaceId);
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json();
    const parsed = createInvoiceSchema(() => "invalid").safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalidData" }, { status: 400 });
    }

    const access = await requireMobileWorkspace(session.user.id, parsed.data.workspaceId, "write");
    if (access instanceof NextResponse) return access;

    const invoice = await createInvoice(parsed.data);
    return NextResponse.json(
      {
        id: serializeId(invoice._id),
        invoiceNumber: invoice.invoiceNumber,
      },
      { status: 201 },
    );
  } catch (error) {
    return mobileErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const body = (await request.json()) as {
      workspaceId?: string;
      invoiceId?: string;
      status?: string;
    };
    if (!body.invoiceId || !body.status || !(INVOICE_STATUSES as readonly string[]).includes(body.status)) {
      return NextResponse.json({ error: "invalidData" }, { status: 400 });
    }

    const access = await requireMobileWorkspace(session.user.id, body.workspaceId, "write");
    if (access instanceof NextResponse) return access;

    await updateInvoiceStatus(
      body.invoiceId,
      access.workspaceId,
      body.status as (typeof INVOICE_STATUSES)[number],
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return mobileErrorResponse(error);
  }
}
