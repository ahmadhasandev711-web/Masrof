import { NextResponse } from "next/server";
import { getProjectFinancialDetails } from "@/features/projects/project-details-data";
import { requireMobileSession, requireMobileWorkspace } from "@/lib/mobile/session";
import { mobileProjectDetailsResponseSchema } from "@contracts/mobile/projects";
import { thrownToMobileResponse } from "@/server/kernel";

/** The web's project page (/dashboard/projects/[id]) as data. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const url = new URL(request.url);
  const access = await requireMobileWorkspace(session.user.id, url.searchParams.get("workspaceId"), "read");
  if (access instanceof NextResponse) return access;

  try {
    const locale = url.searchParams.get("locale") === "en" ? "en" : "ar";
    const details = await getProjectFinancialDetails(id, access.workspaceId, locale);
    if (!details) {
      return NextResponse.json({ error: "projectNotFound" }, { status: 404 });
    }
    return NextResponse.json(
      mobileProjectDetailsResponseSchema.parse({
        project: details.project,
        client: details.client,
        summary: details.summary,
        invoices: details.invoices,
        transactions: details.transactions.map((tx) => ({
          id: tx.id,
          type: tx.type,
          amount: tx.amount,
          transactionDate: tx.transactionDate,
          description: tx.description,
          categoryName: tx.categoryName,
          accountName: tx.accountName,
        })),
      }),
    );
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}
