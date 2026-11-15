import { NextResponse } from "next/server";
import { validationErrorCode } from "@/lib/mobile/validation";
import { revalidatePath, revalidateTag } from "next/cache";
import { invoicesService } from "@/features/invoices/invoices.service";
import {
  createInvoiceSchema,
  invoiceFiltersSchema,
  updateInvoiceSchema,
} from "@/features/invoices/schemas";
import { getEffectiveSubscriptionForWorkspace } from "@/features/subscriptions/data";
import { getPlanQuantityLimit } from "@/features/subscriptions/plan-config-data";
import {
  countInvoicesCreatedThisMonth,
  toQuantityUsage,
} from "@/features/subscriptions/plan-usage";
import { CACHE_TAGS } from "@/lib/cache-tags";
import {
  requireMobileSession,
  requireMobileWorkspace,
  serializeId,
} from "@/lib/mobile/session";
import { toMobileInvoice } from "@/lib/mobile/serialize";
import {
  mobileInvoiceCreatedSchema,
  mobileInvoicePatchBodySchema,
  mobileInvoiceShareResponseSchema,
  mobileInvoicesPageResponseSchema,
} from "@contracts/mobile/invoices";
import { mobileOkSchema } from "@contracts/mobile/common";
import { resultToResponse, thrownToMobileResponse } from "@/server/kernel";

/** Same list as /dashboard/invoices: filters, summary cards and the plan usage meter. */
export async function GET(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const access = await requireMobileWorkspace(session.user.id, params.workspaceId, "read");
  if (access instanceof NextResponse) return access;

  const parsed = invoiceFiltersSchema.safeParse({
    workspaceId: access.workspaceId,
    status: params.status || undefined,
    clientId: params.clientId || undefined,
    projectId: params.projectId || undefined,
    search: params.search || undefined,
    dateFrom: params.dateFrom || undefined,
    dateTo: params.dateTo || undefined,
    page: params.page || 1,
    pageSize: params.pageSize || 30,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "invalidData" }, { status: 400 });
  }

  try {
    const [result, used, subscription] = await Promise.all([
      invoicesService.listWithFilters(parsed.data),
      countInvoicesCreatedThisMonth(access.workspaceId),
      getEffectiveSubscriptionForWorkspace(session.user.id, access.workspaceId),
    ]);
    const limit = await getPlanQuantityLimit(subscription.plan, "maxInvoicesPerMonth");

    return NextResponse.json(
      mobileInvoicesPageResponseSchema.parse({
        items: result.items.map((item) =>
          toMobileInvoice(item as unknown as Record<string, unknown>),
        ),
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
        summary: result.summary,
        usage: toQuantityUsage(used, limit),
      }),
    );
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}

export async function POST(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json();
    // Identity translator: the issue message is the `validation.*` key the app translates.
    const parsed = createInvoiceSchema((key) => key).safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: validationErrorCode(parsed.error) },
        { status: 400 },
      );
    }

    const access = await requireMobileWorkspace(session.user.id, parsed.data.workspaceId, "write");
    if (access instanceof NextResponse) return access;

    const result = await invoicesService.create(session.user.id, parsed.data);
    if (!result.ok) {
      return resultToResponse(result);
    }

    revalidateTag(CACHE_TAGS.invoices, "max");
    revalidatePath("/dashboard/clients");
    return NextResponse.json(
      mobileInvoiceCreatedSchema.parse({
        id: serializeId(result.value._id),
        invoiceNumber: result.value.invoiceNumber,
      }),
      { status: 201 },
    );
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}

/**
 * Invoice actions, each through the same service method the web's actions call.
 * No free status setter: `paid` only comes from payments and `cancelled` only
 * from `cancel` (which refuses invoices that already have payments).
 */
export async function PATCH(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const parsed = mobileInvoicePatchBodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "invalidData" }, { status: 400 });
    }
    const body = parsed.data;

    const access = await requireMobileWorkspace(session.user.id, body.workspaceId, "write");
    if (access instanceof NextResponse) return access;
    const workspaceId = access.workspaceId;

    if (body.action === "update") {
      const input = updateInvoiceSchema((key) => key).safeParse({ ...body, workspaceId });
      if (!input.success) {
        return NextResponse.json(
          { error: validationErrorCode(input.error) },
          { status: 400 },
        );
      }
      const result = await invoicesService.update(input.data);
      if (!result.ok) return resultToResponse(result);
    } else if (body.action === "cancel") {
      const result = await invoicesService.cancel(body.invoiceId, workspaceId);
      if (!result.ok) return resultToResponse(result);
    } else if (body.action === "archive") {
      const result = await invoicesService.archive(body.invoiceId, workspaceId);
      if (!result.ok) return resultToResponse(result);
    } else {
      // share
      if (body.mode === "enable" || body.mode === "disable") {
        await invoicesService.toggleShareable(body.invoiceId, workspaceId, body.mode === "enable");
      }
      const tokenResult =
        body.mode === "regenerate"
          ? await invoicesService.regenerateShareToken(body.invoiceId, workspaceId)
          : await invoicesService.getOrCreateShareToken(body.invoiceId, workspaceId);
      if (!tokenResult.ok) return resultToResponse(tokenResult);
      const invoice = await invoicesService.getListItem(body.invoiceId, workspaceId);

      revalidateTag(CACHE_TAGS.invoices, "max");
      return NextResponse.json(
        mobileInvoiceShareResponseSchema.parse({
          token: tokenResult.value,
          isShareable: invoice?.isShareable ?? true,
        }),
      );
    }

    revalidateTag(CACHE_TAGS.invoices, "max");
    revalidatePath("/dashboard/invoices");
    return NextResponse.json(mobileOkSchema.parse({ ok: true }));
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}
