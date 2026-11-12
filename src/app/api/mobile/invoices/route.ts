import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { invoicesService } from "@/features/invoices/invoices.service";
import { createInvoiceSchema } from "@/features/invoices/schemas";
import { INVOICE_STATUSES } from "@/models/invoice";
import { CACHE_TAGS } from "@/lib/cache-tags";
import {
  requireMobileSession,
  requireMobileWorkspace,
  serializeId,
} from "@/lib/mobile/session";
import { resultToResponse, thrownToMobileResponse } from "@/server/kernel";

export async function GET(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const searchParams = new URL(request.url).searchParams;
  const workspaceId = searchParams.get("workspaceId");
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 30));

  const access = await requireMobileWorkspace(session.user.id, workspaceId, "read");
  if (access instanceof NextResponse) return access;

  const result = await invoicesService.listPaginated(access.workspaceId, page, pageSize);
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

    const result = await invoicesService.create(session.user.id, parsed.data);
    if (!result.ok) {
      return resultToResponse(result);
    }

    revalidateTag(CACHE_TAGS.invoices, "max");
    return NextResponse.json(
      {
        id: serializeId(result.value._id),
        invoiceNumber: result.value.invoiceNumber,
      },
      { status: 201 },
    );
  } catch (error) {
    return thrownToMobileResponse(error);
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
    if (
      !body.invoiceId ||
      !body.status ||
      !(INVOICE_STATUSES as readonly string[]).includes(body.status)
    ) {
      return NextResponse.json({ error: "invalidData" }, { status: 400 });
    }
    if (body.status === "paid") {
      return NextResponse.json({ error: "useRecordPayment" }, { status: 400 });
    }

    const access = await requireMobileWorkspace(session.user.id, body.workspaceId, "write");
    if (access instanceof NextResponse) return access;

    const result = await invoicesService.updateStatus(
      body.invoiceId,
      access.workspaceId,
      body.status as (typeof INVOICE_STATUSES)[number],
    );
    if (!result.ok) {
      return resultToResponse(result);
    }

    revalidateTag(CACHE_TAGS.invoices, "max");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}
