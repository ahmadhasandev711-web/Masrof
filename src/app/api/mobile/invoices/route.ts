import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import {
  createInvoice,
  InvoicePaidStatusNotAllowedError,
  listInvoicesPaginated,
  updateInvoiceStatus,
} from "@/features/invoices/data";
import { createInvoiceSchema } from "@/features/invoices/schemas";
import { INVOICE_STATUSES } from "@/models/invoice";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { countInvoicesCreatedThisMonth } from "@/features/subscriptions/plan-usage";
import { assertWorkspacePlanFeature, assertWorkspaceQuantityLimit } from "@/features/subscriptions/data";
import {
  mobileErrorResponse,
  requireMobileSession,
  requireMobileWorkspace,
  serializeId,
} from "@/lib/mobile/session";

export async function GET(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const searchParams = new URL(request.url).searchParams;
  const workspaceId = searchParams.get("workspaceId");
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 30));

  const access = await requireMobileWorkspace(session.user.id, workspaceId, "read");
  if (access instanceof NextResponse) return access;

  const result = await listInvoicesPaginated(access.workspaceId, page, pageSize);
  return NextResponse.json(result);
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

    const featureError = await assertWorkspacePlanFeature(
      session.user.id,
      parsed.data.workspaceId,
      "clientsAndProjects",
    );
    if (featureError) {
      return NextResponse.json({ error: featureError }, { status: 403 });
    }

    const invoiceCount = await countInvoicesCreatedThisMonth(parsed.data.workspaceId);
    const limitError = await assertWorkspaceQuantityLimit(
      session.user.id,
      parsed.data.workspaceId,
      "maxInvoicesPerMonth",
      invoiceCount,
    );
    if (limitError) {
      return NextResponse.json({ error: "planLimitReached", message: limitError }, { status: 403 });
    }

    const invoice = await createInvoice(parsed.data);
    revalidateTag(CACHE_TAGS.invoices, "max");
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
    if (body.status === "paid") {
      return NextResponse.json({ error: "useRecordPayment" }, { status: 400 });
    }

    const access = await requireMobileWorkspace(session.user.id, body.workspaceId, "write");
    if (access instanceof NextResponse) return access;

    await updateInvoiceStatus(
      body.invoiceId,
      access.workspaceId,
      body.status as (typeof INVOICE_STATUSES)[number],
    );
    revalidateTag(CACHE_TAGS.invoices, "max");
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof InvoicePaidStatusNotAllowedError) {
      return NextResponse.json({ error: error.code }, { status: 400 });
    }
    return mobileErrorResponse(error);
  }
}
