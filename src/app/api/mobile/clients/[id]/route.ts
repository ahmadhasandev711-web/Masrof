import { NextResponse } from "next/server";
import { getClientStatement } from "@/features/clients/statement-data";
import { requireMobileSession, requireMobileWorkspace } from "@/lib/mobile/session";
import { mobileClientStatementResponseSchema } from "@contracts/mobile/clients";
import { thrownToMobileResponse } from "@/server/kernel";

/** The web's client statement (print/statement/[clientId]) as data. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const workspaceId = new URL(request.url).searchParams.get("workspaceId");
  const access = await requireMobileWorkspace(session.user.id, workspaceId, "read");
  if (access instanceof NextResponse) return access;

  try {
    const ws = access.workspace;
    const statement = await getClientStatement(id, access.workspaceId, {
      name: ws.name,
      businessName: ws.businessName,
      logoUrl: ws.logoUrl,
      taxId: ws.taxId,
      businessPhone: ws.businessPhone,
      businessAddress: ws.businessAddress,
      currency: ws.currency,
    });
    if (!statement) {
      return NextResponse.json({ error: "clientNotFound" }, { status: 404 });
    }
    return NextResponse.json(
      mobileClientStatementResponseSchema.parse({
        client: statement.client,
        totalInvoiced: statement.totalInvoiced,
        totalPaid: statement.totalPaid,
        currentOutstanding: statement.currentOutstanding,
        entries: statement.entries,
      }),
    );
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}
