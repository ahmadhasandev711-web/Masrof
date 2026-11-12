import { NextResponse } from "next/server";
import { z } from "zod";
import { invoiceTemplatesService } from "@/features/invoices/invoice-templates.service";
import { requireMobileSession, requireMobileWorkspace } from "@/lib/mobile/session";
import { toMobileInvoiceTemplate } from "@/lib/mobile/serialize";
import {
  mobileInvoiceTemplateCreatedSchema,
  mobileInvoiceTemplatesListResponseSchema,
} from "@contracts/mobile/invoices";
import { mobileOkSchema } from "@contracts/mobile/common";
import { resultToResponse, thrownToMobileResponse } from "@/server/kernel";

const createBodySchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().trim().min(1).max(80),
  items: z
    .array(
      z.object({
        description: z.string().trim().min(1).max(200),
        quantity: z.coerce.number().positive(),
        unitPrice: z.coerce.number().positive(),
      }),
    )
    .min(1),
  taxEnabled: z.boolean().optional(),
  taxRatePercent: z.coerce.number().min(0).max(100).optional(),
});

const patchBodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("update"),
    workspaceId: z.string().min(1),
    templateId: z.string().min(1),
    name: z.string().trim().min(1).max(80),
    items: z
      .array(
        z.object({
          description: z.string().trim().min(1).max(200),
          quantity: z.coerce.number().positive(),
          unitPrice: z.coerce.number().positive(),
        }),
      )
      .min(1),
    taxEnabled: z.boolean().optional(),
    taxRatePercent: z.coerce.number().min(0).max(100).optional(),
  }),
  z.object({
    action: z.literal("archive"),
    workspaceId: z.string().min(1),
    templateId: z.string().min(1),
  }),
  z.object({
    action: z.literal("reorder"),
    workspaceId: z.string().min(1),
    orderedIds: z.array(z.string().min(1)).min(1),
  }),
]);

export async function GET(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  const access = await requireMobileWorkspace(session.user.id, workspaceId, "read");
  if (access instanceof NextResponse) return access;

  const items = await invoiceTemplatesService.listForWorkspace(access.workspaceId);
  return NextResponse.json(
    mobileInvoiceTemplatesListResponseSchema.parse({
      items: items.map((item) =>
        toMobileInvoiceTemplate(item as unknown as Record<string, unknown>),
      ),
    }),
  );
}

export async function POST(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json();
    const parsed = createBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalidData" }, { status: 400 });
    }

    const access = await requireMobileWorkspace(session.user.id, parsed.data.workspaceId, "write");
    if (access instanceof NextResponse) return access;

    const result = await invoiceTemplatesService.create(session.user.id, parsed.data);
    if (!result.ok) return resultToResponse(result);

    return NextResponse.json(
      mobileInvoiceTemplateCreatedSchema.parse(
        toMobileInvoiceTemplate(result.value as unknown as Record<string, unknown>),
      ),
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
    const body = await request.json();
    const parsed = patchBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalidData" }, { status: 400 });
    }

    const access = await requireMobileWorkspace(session.user.id, parsed.data.workspaceId, "write");
    if (access instanceof NextResponse) return access;

    if (parsed.data.action === "update") {
      const result = await invoiceTemplatesService.update(session.user.id, parsed.data);
      if (!result.ok) return resultToResponse(result);
    } else if (parsed.data.action === "archive") {
      const result = await invoiceTemplatesService.archive(
        session.user.id,
        parsed.data.workspaceId,
        parsed.data.templateId,
      );
      if (!result.ok) return resultToResponse(result);
    } else {
      const result = await invoiceTemplatesService.reorder(
        session.user.id,
        parsed.data.workspaceId,
        parsed.data.orderedIds,
      );
      if (!result.ok) return resultToResponse(result);
    }

    return NextResponse.json(mobileOkSchema.parse({ ok: true }));
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}
